<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesPosRequest;
use App\Repositories\All\SalesPos\SalesPosInterface;

class SalesPosController extends Controller
{
    private SalesPosInterface $salesPosRepo;

    public function __construct(SalesPosInterface $salesPosRepo)
    {
        $this->salesPosRepo = $salesPosRepo;
    }

    public function index()
    {
        return response()->json($this->salesPosRepo->all(), 200);
    }

    public function store(SalesPosRequest $request)
    {
        $salesPos = $this->salesPosRepo->create($request->validated());
        return response()->json($salesPos, 201);
    }

    public function show($id)
    {
        $salesPos = $this->salesPosRepo->find($id);

        if (!$salesPos) {
            return response()->json(['message' => 'Sales POS not found'], 404);
        }

        return response()->json($salesPos, 200);
    }

    public function update(SalesPosRequest $request, $id)
    {
        $updated = $this->salesPosRepo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Sales POS not found'], 404);
        }

        return response()->json(['message' => 'Sales POS updated successfully'], 200);
    }

    public function destroy($id)
    {
        $deleted = $this->salesPosRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Sales POS not found'], 404);
        }

        return response()->json(['message' => 'Sales POS deleted successfully'], 200);
    }
}
