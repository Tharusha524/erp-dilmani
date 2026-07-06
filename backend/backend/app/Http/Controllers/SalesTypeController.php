<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesTypeRequest;
use App\Repositories\All\SalesType\SalesTypeInterface;

class SalesTypeController extends Controller
{
    private SalesTypeInterface $salesTypeRepo;

    public function __construct(SalesTypeInterface $salesTypeRepo)
    {
        $this->salesTypeRepo = $salesTypeRepo;
    }

    public function index()
    {
        return response()->json($this->salesTypeRepo->all());
    }

    public function store(SalesTypeRequest $request)
    {
        $salesType = $this->salesTypeRepo->create($request->validated());
        return response()->json($salesType, 201);
    }

    public function show(string $id)
    {
        $salesType = $this->salesTypeRepo->find($id);
        if (!$salesType) {
            return response()->json(['message' => 'Sales type not found'], 404);
        }
        return response()->json($salesType);
    }

    public function update(SalesTypeRequest $request, string $id)
    {
        $updated = $this->salesTypeRepo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Sales type not found'], 404);
        }

        return response()->json(['message' => 'Sales type updated successfully']);
    }

    public function destroy(string $id)
    {
        $deleted = $this->salesTypeRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Sales type not found'], 404);
        }

        return response()->json(['message' => 'Sales type deleted successfully']);
    }
}
