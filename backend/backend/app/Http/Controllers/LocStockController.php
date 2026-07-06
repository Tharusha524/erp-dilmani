<?php

namespace App\Http\Controllers;

use App\Http\Requests\LocStockRequest;
use App\Repositories\All\LocStock\LocStockInterface;

class LocStockController extends Controller
{
    private LocStockInterface $locStock;

    public function __construct(LocStockInterface $locStock)
    {
        $this->locStock = $locStock;
    }

    public function index()
    {
        return response()->json($this->locStock->all());
    }

    public function store(LocStockRequest $request)
    {
        $locStock = $this->locStock->create($request->validated());
        return response()->json($locStock, 201);
    }

    public function show($locCode, $stockId)
    {
        $locStock = $this->locStock->findByCompositeKey($locCode, $stockId);
        if (!$locStock) {
            return response()->json(['message' => 'Loc stock not found'], 404);
        }
        return response()->json($locStock);
    }

    public function update(LocStockRequest $request, $locCode, $stockId)
    {
        $validated = $request->validated();
        unset($validated['loc_code'], $validated['stock_id']);

        $updated = $this->locStock->updateByCompositeKey($locCode, $stockId, $validated);

        if (!$updated) {
            return response()->json(['message' => 'Loc stock not found'], 404);
        }

        $updatedItem = $this->locStock->findByCompositeKey($locCode, $stockId);

        return response()->json([
            'message' => 'Loc stock updated successfully',
            'item' => $updatedItem
        ], 200);
    }

}
