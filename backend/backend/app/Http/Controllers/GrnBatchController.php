<?php

namespace App\Http\Controllers;

use App\Http\Requests\GrnBatchRequest;
use App\Repositories\All\GrnBatch\GrnBatchInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class GrnBatchController extends Controller
{
    public function __construct(
        private GrnBatchInterface $grnBatch,
        protected ?PostingsService $postings = null
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->grnBatch->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(GrnBatchRequest $request)
    {
        $data = $this->grnBatch->create($request->validated());

        $glWarning = $this->repostGrnBatchFromRecord($data);

        return response()->json(GlPostingRunner::mergeWarning($data instanceof \Illuminate\Database\Eloquent\Model ? $data->toArray() : (array) $data, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->grnBatch->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(GrnBatchRequest $request, string $id)
    {
        $this->grnBatch->update($id, $request->validated());
        $record = $this->grnBatch->find($id);
        $glWarning = $this->repostGrnBatchFromRecord($record);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if ($this->postings) {
            $this->postings->deletePostedGl(25, (int) $id);
        }

        $this->grnBatch->delete($id);

        return response()->json(['message' => 'Deleted']);
    }

    private function repostGrnBatchFromRecord($record): ?string
    {
        if (! $this->postings || ! $record) {
            return null;
        }

        $batchId = (int) ($record->id ?? 0);
        if ($batchId <= 0) {
            return null;
        }

        $run = GlPostingRunner::run(fn () => $this->postings->postGrnBatch($batchId));

        return $run['gl_warning'];
    }
}
