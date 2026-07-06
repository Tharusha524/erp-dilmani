<?php

namespace App\Http\Controllers;

use App\Http\Requests\DebtorTransDetailsRequest;
use App\Repositories\All\DebtorTransDetails\DebtorTransDetailsInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class DebtorTransDetailsController extends Controller
{
    private DebtorTransDetailsInterface $repo;

    public function __construct(
        DebtorTransDetailsInterface $repo,
        protected ?PostingsService $postings = null
    ) {
        $this->repo = $repo;
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
    public function store(DebtorTransDetailsRequest $request)
    {
        $data = $request->validated();
        $created = $this->repo->create($data);
        $glWarning = $this->repostFromPayload($data);

        return response()->json(
            GlPostingRunner::mergeWarning($created instanceof \Illuminate\Database\Eloquent\Model ? $created->toArray() : (array) $created, $glWarning),
            201
        );
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
    public function update(DebtorTransDetailsRequest $request, string $id)
    {
        $data = $request->validated();
        $updated = $this->repo->update($id, $data);
        $glWarning = $this->repostFromDetailId($id, $data);

        return response()->json(GlPostingRunner::mergeWarning(['success' => $updated], $glWarning));
    }

    public function destroy(string $id)
    {
        $record = $this->repo->find($id);
        $deleted = $this->repo->delete($id);
        $glWarning = null;

        if ($deleted && $record) {
            $glWarning = $this->repostFromPayload([
                'debtor_trans_type' => $record->debtor_trans_type ?? 10,
                'debtor_trans_no' => $record->debtor_trans_no ?? 0,
            ]);
        }

        return response()->json(GlPostingRunner::mergeWarning(['success' => $deleted], $glWarning));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function repostFromPayload(array $data): ?string
    {
        if (! $this->postings || empty($data['debtor_trans_no'])) {
            return null;
        }

        $run = GlPostingRunner::run(fn () => $this->postings->repostDebtorTrans((object) [
            'trans_type' => (int) ($data['debtor_trans_type'] ?? 10),
            'trans_no' => (int) $data['debtor_trans_no'],
        ]));

        return $run['gl_warning'];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function repostFromDetailId(string $id, array $data = []): ?string
    {
        if (! empty($data['debtor_trans_no'])) {
            return $this->repostFromPayload($data);
        }

        $record = $this->repo->find($id);
        if (! $record) {
            return null;
        }

        return $this->repostFromPayload([
            'debtor_trans_type' => $record->debtor_trans_type ?? 10,
            'debtor_trans_no' => $record->debtor_trans_no ?? 0,
        ]);
    }
}
