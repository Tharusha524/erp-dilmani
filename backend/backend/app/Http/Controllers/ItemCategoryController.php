<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemCategoryRequest;
use App\Repositories\All\ItemCategory\ItemCategoryInterface;
use Illuminate\Http\Request;

class ItemCategoryController extends Controller
{   
    private ItemCategoryInterface $repo;

    public function __construct(ItemCategoryInterface $repo)
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
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ItemCategoryRequest $request)
    {
        $itemCategory = $this->repo->create($request->validated());
        return response()->json($itemCategory, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $InventoryLocation = $this->repo->find($id);

        if (!$InventoryLocation) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($InventoryLocation, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ItemCategoryRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($updated, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(null, 204);
    }
}
