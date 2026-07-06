<?php

namespace App\Http\Controllers;

use App\Http\Requests\CrmCategoryRequest;
use App\Repositories\All\CrmCategory\CrmCategoryInterface;

class CrmCategoryController extends Controller
{
    private CrmCategoryInterface $crmCategoryRepo;

    public function __construct(CrmCategoryInterface $crmCategoryRepo)
    {
        $this->crmCategoryRepo = $crmCategoryRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->crmCategoryRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CrmCategoryRequest $request)
    {
        $category = $this->crmCategoryRepo->create($request->validated());
        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = $this->crmCategoryRepo->find($id);

        if (!$category) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($category, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CrmCategoryRequest $request, string $id)
    {
        $updated = $this->crmCategoryRepo->update($id, $request->validated());

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
        $deleted = $this->crmCategoryRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
