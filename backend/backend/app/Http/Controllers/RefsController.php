<?php

namespace App\Http\Controllers;

use App\Http\Requests\RefsRequest;
use App\Repositories\All\Refs\RefsInterface;
use Illuminate\Http\JsonResponse;

class RefsController extends Controller
{
    private RefsInterface $refsRepository;

    public function __construct(RefsInterface $refsRepository)
    {
        $this->refsRepository = $refsRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->refsRepository->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RefsRequest $request): JsonResponse
    {
        $ref = $this->refsRepository->create($request->validated());
        return response()->json($ref, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $ref = $this->refsRepository->find($id);
        if (! $ref) {
            return response()->json(['message' => 'Reference not found'], 404);
        }
        return response()->json($ref);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RefsRequest $request, string $id): JsonResponse
    {
        $updated = $this->refsRepository->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Reference not found or not updated'], 404);
        }
        return response()->json(['message' => 'Reference updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->refsRepository->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Reference not found or could not be deleted'], 404);
        }
        return response()->json(['message' => 'Reference deleted successfully']);
    }
}
