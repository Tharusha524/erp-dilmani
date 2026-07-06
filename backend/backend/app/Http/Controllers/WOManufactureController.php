<?php

namespace App\Http\Controllers;

use App\Http\Requests\WOManufactureRequest;
use App\Repositories\All\WOManufacture\WOManufactureInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class WOManufactureController extends Controller
{
    private WOManufactureInterface $repo;

    public function __construct(
        WOManufactureInterface $repo,
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
    public function store(WOManufactureRequest $request)
    {
        $record = $this->repo->create($request->validated());

        $glWarning = null;
        if ($this->postings && ! empty($record->id)) {
            $run = GlPostingRunner::run(fn () => $this->postings->postWoManufacture((int) $record->id));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning($record instanceof \Illuminate\Database\Eloquent\Model ? $record->toArray() : (array) $record, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->repo->find($id);

        if (! $record) {
            return response()->json(['message' => 'Manufacture record not found'], 404);
        }

        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(WOManufactureRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        if (! $updated) {
            return response()->json(['message' => 'Update failed'], 404);
        }

        $glWarning = null;
        if ($this->postings) {
            $run = GlPostingRunner::run(fn () => $this->postings->postWoManufacture((int) $id));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated successfully'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if ($this->postings) {
            $this->postings->deletePostedGl(29, (int) $id);
        }

        $deleted = $this->repo->delete($id);

        if (! $deleted) {
            return response()->json(['message' => 'Delete failed'], 404);
        }

        return response()->json(['message' => 'Deleted successfully']);
    }
}
