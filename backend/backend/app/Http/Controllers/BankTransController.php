<?php

namespace App\Http\Controllers;

use App\Http\Requests\BankTransRequest;
use App\Repositories\All\BankTrans\BankTransInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class BankTransController extends Controller
{
    protected BankTransInterface $repo;

    protected ?PostingsService $postings;

    public function __construct(BankTransInterface $repo, PostingsService $postings = null)
    {
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
    public function store(BankTransRequest $request)
    {
        $data = $request->validated();
        $amount = (float) ($data['amount'] ?? 0);
        $bankAct = (int) ($data['bank_act'] ?? 0);

        try {
            if ($bankAct > 0 && $amount < -0.001) {
                $balanceService = app(\App\Services\Banking\BankBalanceService::class);
                $balanceService->assertAllowedPaymentSource($bankAct);
                $balanceService->assertSufficientBalance(
                    $bankAct,
                    abs($amount),
                    (string) ($data['trans_date'] ?? now()->toDateString()),
                    (int) ($data['type'] ?? 0),
                    (int) ($data['trans_no'] ?? 0),
                    false
                );
            }

            $record = $this->repo->create($data);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $glWarning = null;
        if ($this->postings) {
            $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($record));
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
    public function update(BankTransRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());
        $glWarning = null;

        if ($this->postings) {
            $record = $this->repo->find($id);
            if ($record) {
                $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($record));
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
            $type = (int) ($record->type ?? 0);
            $no = (int) ($record->trans_no ?? 0);
            if ($no > 0) {
                $this->postings->deletePostedGl($type, $no);
            }
        }

        $this->repo->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
