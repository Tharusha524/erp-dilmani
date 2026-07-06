<?php

namespace App\Http\Controllers;

use App\Http\Requests\RefLineRequest;
use App\Repositories\All\Reflines\ReflinesInterface;
use Illuminate\Http\JsonResponse;

class RefLinesController extends Controller
{
    private ReflinesInterface $reflinesRepository;

    public function __construct(ReflinesInterface $reflinesRepository)
    {
        $this->reflinesRepository = $reflinesRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->reflinesRepository->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RefLineRequest $request): JsonResponse
    {
        $reflines = $this->reflinesRepository->create($request->validated());
        return response()->json($reflines, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $refline = $this->reflinesRepository->find($id);
        if (! $refline) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($refline);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RefLineRequest $request, string $id): JsonResponse
    {
        $updated = $this->reflinesRepository->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Update failed'], 404);
        }
        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->reflinesRepository->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Delete failed'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
