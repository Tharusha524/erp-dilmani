<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockFaClassRequest;
use App\Repositories\All\StockFaClass\StockFaClassInterface;

class StockFaClassController extends Controller
{
    private StockFaClassInterface $stockFaClassRepo;

    public function __construct(StockFaClassInterface $stockFaClassRepo)
    {
        $this->stockFaClassRepo = $stockFaClassRepo;
    }

    public function index()
    {
        return response()->json($this->stockFaClassRepo->all());
    }

    public function store(StockFaClassRequest $request)
    {
        $stockFaClass = $this->stockFaClassRepo->create($request->validated());
        return response()->json($stockFaClass, 201);
    }

    public function show(int $id)
    {
        $stockFaClass = $this->stockFaClassRepo->find($id);
        if (!$stockFaClass) {
            return response()->json(['message' => 'Stock FA Class not found'], 404);
        }
        return response()->json($stockFaClass);
    }

    public function update(StockFaClassRequest $request, string $id)
    {
        $updated = $this->stockFaClassRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Stock FA Class not found'], 404);
        }
        return response()->json($this->stockFaClassRepo->find($id));
    }

    public function destroy(string $id)
    {
        $deleted = $this->stockFaClassRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Stock FA Class not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
