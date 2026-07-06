<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaxGroupItemRequest;
use App\Repositories\All\TaxGroupItem\TaxGroupItemInterface;

class TaxGroupItemController extends Controller
{
    private TaxGroupItemInterface $taxGroupItemRepo;

    public function __construct(TaxGroupItemInterface $taxGroupItemRepo)
    {
        $this->taxGroupItemRepo = $taxGroupItemRepo;
    }

    public function index()
    {
        return response()->json($this->taxGroupItemRepo->all());
    }

    public function store(TaxGroupItemRequest $request)
    {
        $taxGroupItem = $this->taxGroupItemRepo->create($request->validated());
        return response()->json($taxGroupItem, 201);
    }

    public function show(int $id)
    {
        $taxGroupItem = $this->taxGroupItemRepo->find($id);
        if (!$taxGroupItem) {
            return response()->json(['message' => 'Tax group item not found'], 404);
        }
        return response()->json($taxGroupItem);
    }

    public function update(TaxGroupItemRequest $request, $taxGroupId, $taxTypeId)
    {
        $updated = $this->taxGroupItemRepo->update($taxGroupId, $taxTypeId, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Tax group item not found'], 404);
        }

        $updatedItem = $this->taxGroupItemRepo->find($taxGroupId, $taxTypeId);

        return response()->json([
            'message' => 'Tax group item updated successfully',
            'item' => $updatedItem
        ], 200);
    }



    public function destroy(int $tax_group_id, int $tax_type_id)
    {
        $deleted = $this->taxGroupItemRepo->deleteByCompositeKey($tax_group_id, $tax_type_id);

        if (!$deleted) {
            return response()->json(['message' => 'Tax group item not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
