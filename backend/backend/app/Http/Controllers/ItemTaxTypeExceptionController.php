<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemTaxTypeExceptionRequest;
use App\Repositories\All\ItemTaxTypeException\ItemTaxTypeExceptionInterface;

class ItemTaxTypeExceptionController extends Controller
{
    private ItemTaxTypeExceptionInterface $itemTaxTypeException;

    public function __construct(ItemTaxTypeExceptionInterface $itemTaxTypeException)
    {
        $this->itemTaxTypeException = $itemTaxTypeException;
    }

    public function index()
    {
        return response()->json($this->itemTaxTypeException->all());
    }

    public function store(ItemTaxTypeExceptionRequest $request)
    {
        $itemTaxTypeException = $this->itemTaxTypeException->create($request->validated());
        return response()->json($itemTaxTypeException, 201);
    }

    public function show(int $id)
    {
        $itemTaxTypeException = $this->itemTaxTypeException->find($id);
        if (!$itemTaxTypeException) {
            return response()->json(['message' => 'Item tax type exception not found'], 404);
        }
        return response()->json($itemTaxTypeException);
    }

    public function update(ItemTaxTypeExceptionRequest $request, $itemTaxTypeId, $taxTypeId)
    {
        $updated = $this->itemTaxTypeException->update($itemTaxTypeId, $taxTypeId, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Item tax type exception not found'], 404);
        }

        $updatedItem = $this->itemTaxTypeException->find($itemTaxTypeId, $taxTypeId);

        return response()->json([
            'message' => 'Item tax type exception updated successfully',
            'item' => $updatedItem
        ], 200);
    }



    public function destroy(int $item_id, int $tax_type_id)
    {
        $deleted = $this->itemTaxTypeException->deleteByCompositeKey($item_id, $tax_type_id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
