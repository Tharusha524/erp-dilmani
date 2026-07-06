<?php

namespace App\Http\Controllers;

use App\Http\Requests\DimensionTagRequest;
use App\Repositories\All\DimensionTag\DimensionTagInterface;

class DimensionTagController extends Controller
{
    private DimensionTagInterface $tagRepo;

    public function __construct(DimensionTagInterface $tagRepo)
    {
        $this->tagRepo = $tagRepo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->tagRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DimensionTagRequest $request)
    {
        $tag = $this->tagRepo->create($request->validated());
        return response()->json($tag, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tag = $this->tagRepo->find($id);

        if (!$tag) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        return response()->json($tag, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DimensionTagRequest $request, string $id)
    {
        $updated = $this->tagRepo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        return response()->json(['message' => 'Tag updated successfully'], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->tagRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        return response()->json(['message' => 'Tag deleted successfully'], 200);
    }
}
