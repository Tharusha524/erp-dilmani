<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransTaxDetailRequest;
use App\Repositories\All\TransTaxDetail\TransTaxDetailInterface;
use Illuminate\Http\JsonResponse;

class TransTaxDetailController extends Controller
{
    private TransTaxDetailInterface $transTaxDetailRepo;

    public function __construct(TransTaxDetailInterface $transTaxDetailRepo)
    {
        $this->transTaxDetailRepo = $transTaxDetailRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->transTaxDetailRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TransTaxDetailRequest $request): JsonResponse
    {
        $record = $this->transTaxDetailRepo->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): JsonResponse
    {
        $record = $this->transTaxDetailRepo->find($id);

        if (! $record) {
            return response()->json(['message' => 'Transaction type not found'], 404);
        }

        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TransTaxDetailRequest $request, string $id): JsonResponse
    {
        $success = $this->transTaxDetailRepo->update($id, $request->validated());
        if (! $success) {
            return response()->json(['message' => 'Update failed'], 404);
        }
        return response()->json(['message' => 'Update successful']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->transTaxDetailRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Delete failed'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
