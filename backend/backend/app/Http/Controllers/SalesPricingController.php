<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesPricingRequest;
use App\Models\SalesPricing;
use App\Repositories\All\SalesPricing\SalesPricingInterface;
use Illuminate\Http\Request;

class SalesPricingController extends Controller
{
    private SalesPricingInterface $salesPricingRepo;

    public function __construct(SalesPricingInterface $salesPricingRepo)
    {
        $this->salesPricingRepo = $salesPricingRepo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $stockId = $request->query('stock_id');
        if ($stockId) {
            return response()->json(
                $this->salesPricingRepo->allWithRelationsByStockId($stockId),
                200
            );
        }

        return response()->json(
            $this->salesPricingRepo->allWithRelations(),
            200
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SalesPricingRequest $request)
    {
        $validated = $request->validated();

        if ($this->duplicateExists($validated)) {
            return response()->json([
                'message' => 'A sales pricing with this currency and sales type already exists for this item.',
            ], 422);
        }

        $salesPricing = $this->salesPricingRepo->create($validated);
        return response()->json($salesPricing, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $salesPricing = $this->salesPricingRepo->findWithRelations($id);

        if (!$salesPricing) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($salesPricing, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SalesPricingRequest $request, string $id)
    {
        $validated = $request->validated();

        if ($this->duplicateExists($validated, $id)) {
            return response()->json([
                'message' => 'A sales pricing with this currency and sales type already exists for this item.',
            ], 422);
        }

        $updated = $this->salesPricingRepo->update($id, $validated);

        if (!$updated) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Updated successfully'], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->salesPricingRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    private function duplicateExists(array $validated, ?string $excludeId = null): bool
    {
        $query = SalesPricing::query()
            ->where('stock_id', $validated['stock_id'])
            ->where('currency_id', $validated['currency_id'])
            ->where('sales_type_id', $validated['sales_type_id']);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
