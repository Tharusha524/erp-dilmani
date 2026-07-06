<?php

namespace App\Http\Controllers;

use App\Http\Requests\GrnItemsRequest;
use App\Repositories\All\GrnItems\GrnItemsInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class GrnItemsController extends Controller
{
    private GrnItemsInterface $grnItems;

    public function __construct(
        GrnItemsInterface $grnItems,
        protected ?PostingsService $postings = null
    ) {
        $this->grnItems = $grnItems;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->grnItems->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(GrnItemsRequest $request)
    {
        $validated = $request->validated();
        $data = $this->grnItems->create($validated);

        $glWarning = null;
        if ($this->postings && ! empty($validated['grn_batch_id'])) {
            $run = GlPostingRunner::run(fn () => $this->postings->postGrnBatch((int) $validated['grn_batch_id']));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning($data instanceof \Illuminate\Database\Eloquent\Model ? $data->toArray() : (array) $data, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->grnItems->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(GrnItemsRequest $request, string $id)
    {
        $existing = $this->grnItems->find($id);
        $validated = $request->validated();
        $this->grnItems->update($id, $validated);
        $glWarning = $this->repostGrnFromItem($existing, $validated);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $existing = $this->grnItems->find($id);
        $this->grnItems->delete($id);
        $glWarning = $this->repostGrnFromItem($existing, []);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Deleted'], $glWarning));
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function repostGrnFromItem($record, array $validated): ?string
    {
        if (! $this->postings) {
            return null;
        }

        $batchId = (int) ($validated['grn_batch_id'] ?? $record->grn_batch_id ?? 0);
        if ($batchId <= 0) {
            return null;
        }

        $run = GlPostingRunner::run(fn () => $this->postings->postGrnBatch($batchId));

        return $run['gl_warning'];
    }
}
