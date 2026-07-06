<?php

namespace App\Http\Controllers;

use App\Http\Requests\DebtorTransRequest;
use App\Repositories\All\DebtorTrans\DebtorTransInterface;
use App\Services\Accounting\PostingsService;
use App\Services\Sales\CustomerCreditService;
use App\Support\GlPostingRunner;

class DebtorTransController extends Controller
{
    protected DebtorTransInterface $repo;

    protected ?PostingsService $postings;

    public function __construct(
        DebtorTransInterface $repo,
        PostingsService $postings = null,
        private ?CustomerCreditService $customerCredit = null
    ) {
        $this->repo = $repo;
        $this->postings = $postings;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DebtorTransRequest $request)
    {
        $data = $request->validated();
        $transType = (int) ($data['trans_type'] ?? 0);
        $debtorNo = (int) ($data['debtor_no'] ?? 0);
        if ($this->customerCredit && $debtorNo > 0) {
            try {
                if (in_array($transType, [10, 13], true)) {
                    $this->customerCredit->assertInvoicingAllowed($debtorNo);
                }
                if ($transType === 10) {
                    $net = abs(
                        (float) ($data['ov_amount'] ?? 0)
                        + (float) ($data['ov_gst'] ?? 0)
                        + (float) ($data['ov_freight'] ?? 0)
                        + (float) ($data['ov_freight_tax'] ?? 0)
                        + (float) ($data['ov_discount'] ?? 0)
                    );
                    $this->customerCredit->assertCanExtendCredit($debtorNo, $net);
                }
            } catch (\InvalidArgumentException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        $record = $this->repo->create($data);

        $glWarning = null;
        if ($this->postings) {
            $run = GlPostingRunner::run(fn () => $this->postings->repostDebtorTrans($record));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning($record instanceof \Illuminate\Database\Eloquent\Model ? $record->toArray() : (array) $record, $glWarning));
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->repo->find($id);

        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DebtorTransRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());
        $glWarning = null;

        if ($this->postings) {
            $record = $this->repo->find($id);
            if ($record) {
                $run = GlPostingRunner::run(fn () => $this->postings->repostDebtorTrans($record));
                $glWarning = $run['gl_warning'];
            }
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated successfully'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $record = $this->repo->find($id);
        if ($record && $this->postings) {
            $type = (int) ($record->trans_type ?? 0);
            $no = (int) ($record->trans_no ?? 0);
            if ($no > 0 && in_array($type, [10, 11], true)) {
                $this->postings->deletePostedGl($type, $no);
            }
        }

        $this->repo->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
