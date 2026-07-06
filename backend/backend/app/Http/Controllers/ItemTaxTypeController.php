<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemTaxTypeRequest;
use App\Repositories\All\ItemTaxType\ItemTaxTypeInterface;

class ItemTaxTypeController extends Controller
{   
    private ItemTaxTypeInterface $repo;

    public function __construct(ItemTaxTypeInterface $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all(), 200);
    }

    /**
     * Store a newly created resource.
     */
    public function store(ItemTaxTypeRequest $request)
    {
        $itemTaxType = $this->repo->create($request->validated());
        return response()->json($itemTaxType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $itemTaxType = $this->repo->find($id);

        if (!$itemTaxType) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($itemTaxType, 200);
    }

    /**
     * Update the specified resource.
     */
    public function update(ItemTaxTypeRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Updated successfully'], 200);
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(string $id)
    {
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
