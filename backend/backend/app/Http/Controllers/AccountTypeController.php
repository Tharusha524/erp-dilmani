<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountTypeRequest;
use App\Repositories\All\AccountType\AccountTypeInterface;

class AccountTypeController extends Controller
{
    private AccountTypeInterface $accountTypeRepository;

    public function __construct(AccountTypeInterface $accountTypeRepository)
    {
        $this->accountTypeRepository = $accountTypeRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = $this->accountTypeRepository->all();
        return response()->json($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AccountTypeRequest $request)
    {
        $data = $this->accountTypeRepository->create($request->validated());
        return response()->json(['message' => 'Account Type created successfully', 'data' => $data], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $data = $this->accountTypeRepository->find($id);
        if (!$data) {
            return response()->json(['message' => 'Account Type not found'], 404);
        }
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(AccountTypeRequest $request, string $id)
    {
        $updated = $this->accountTypeRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Update failed or Account Type not found'], 404);
        }
        return response()->json(['message' => 'Account Type updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->accountTypeRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Delete failed or Account Type not found'], 404);
        }
        return response()->json(['message' => 'Account Type deleted successfully']);
    }
}
