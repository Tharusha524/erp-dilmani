<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerBranchRequest;
use App\Repositories\All\CustomerBranch\CustomerBranchInterface;

class CustomerBranchController extends Controller
{
    private CustomerBranchInterface $customerBranchRepo;

    public function __construct(CustomerBranchInterface $customerBranchRepo)
    {
        $this->customerBranchRepo = $customerBranchRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->customerBranchRepo->allWithRelations());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CustomerBranchRequest $request)
    {
        $customerBranch = $this->customerBranchRepo->create($request->validated());
        return response()->json($customerBranch, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $customerBranch = $this->customerBranchRepo->find($id);
        if (!$customerBranch) return response()->json(['message' => 'Not Found'], 404);
        $customerBranch->load(['debtor', 'salesArea', 'salesPerson', 'inventoryLocation', 'taxGroup', 'shippingCompany', 'salesGroup']);
        return response()->json($customerBranch);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CustomerBranchRequest $request, string $id)
    {
        $updated = $this->customerBranchRepo->update($id, $request->validated());
        if (!$updated) return response()->json(['message' => 'Update failed or record not found'], 404);
        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->customerBranchRepo->delete($id);
        if (!$deleted) return response()->json(['message' => 'Delete failed or record not found'], 404);
        return response()->json(['message' => 'Deleted successfully']);
    }
}
