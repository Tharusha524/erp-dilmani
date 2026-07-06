<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemCodesRequest;
use App\Repositories\All\ItemCodes\ItemCodesInterface;
use Illuminate\Http\Request;

class ItemCodesController extends Controller
{
    private ItemCodesInterface $itemCodesRepository;

    public function __construct(ItemCodesInterface $itemCodesRepository)
    {
        $this->itemCodesRepository = $itemCodesRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->itemCodesRepository->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ItemCodesRequest $request)
    {
        $itemCode = $this->itemCodesRepository->create($request->validated());
        return response()->json($itemCode, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $itemCode = $this->itemCodesRepository->find($id);
        if (!$itemCode) {
            return response()->json(['message' => 'Item code not found'], 404);
        }
        return response()->json($itemCode);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ItemCodesRequest $request, string $id)
    {
        $updated = $this->itemCodesRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Item code not found or not updated'], 404);
        }
        return response()->json(['message' => 'Item code updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->itemCodesRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Item code not found or could not be deleted'], 404);
        }
        return response()->json(['message' => 'Item code deleted successfully']);
    }
}
