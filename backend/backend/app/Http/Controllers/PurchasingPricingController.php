<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchasingPricingRequest;
use App\Repositories\All\PurchasingPricing\PurchasingPricingInterface;
use Illuminate\Http\Request;

class PurchasingPricingController extends Controller
{
    private PurchasingPricingInterface $purchasingPricing;

    public function __construct(PurchasingPricingInterface $purchasingPricing)
    {
        $this->purchasingPricing = $purchasingPricing;
    }

    public function index(Request $request)
    {
        $stockId = $request->query('stock_id');
        if ($stockId) {
            return response()->json(
                $this->purchasingPricing->allByStockId((string) $stockId)
            );
        }

        return response()->json($this->purchasingPricing->all());
    }

    public function store(PurchasingPricingRequest $request)
    {
        $purchasingPricing = $this->purchasingPricing->create($request->validated());
        return response()->json($purchasingPricing, 201);
    }

    public function show(int $id)
    {
        $purchasingPricing = $this->purchasingPricing->find($id);
        if (!$purchasingPricing) {
            return response()->json(['message' => 'Purchasing pricing not found'], 404);
        }
        return response()->json($purchasingPricing);
    }

    public function update(PurchasingPricingRequest $request, $supplier_id, $stock_id)
    {
        $validated = $request->validated();
        unset($validated['supplier_id'], $validated['stock_id']);

        $updated = $this->purchasingPricing->updateByCompositeKey($supplier_id, $stock_id, $validated);

        if (!$updated) {
            return response()->json(['message' => 'Purchasing pricing not found'], 404);
        }

        $updatedItem = $this->purchasingPricing->findByCompositeKey($supplier_id, $stock_id);

        return response()->json([
            'message' => 'Purchasing pricing updated successfully',
            'item' => $updatedItem
        ], 200);
    }



    public function destroy($supplier_id, $stock_id)
    {
        $deleted = $this->purchasingPricing->deleteByCompositeKey($supplier_id, $stock_id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    public function showToUpdate(int $supplier_id, string $stock_id)
{
    $purchasingPricing = $this->purchasingPricing->findByCompositeKey($supplier_id, $stock_id);

    if (!$purchasingPricing) {
        return response()->json(['message' => 'Purchasing pricing not found'], 404);
    }

    return response()->json($purchasingPricing);
}

}
