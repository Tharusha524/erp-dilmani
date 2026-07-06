<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItemUnitRequest;
use App\Models\ItemUnit;
use App\Repositories\All\ItemUnit\ItemUnitInterface;
use Illuminate\Http\Request;

class ItemUnitController extends Controller
{   
    private ItemUnitInterface $repo;

    public function __construct(ItemUnitInterface $repo)
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
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ItemUnitRequest $request)
    {
        $ItemUnit = $this->repo->create($request->validated());
        return response()->json($ItemUnit, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $ItemUnit = $this->repo->find($id);

        if (!$ItemUnit) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($ItemUnit, 200);
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
    public function update(ItemUnitRequest $request, string $id)
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

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
