<?php

namespace App\Http\Controllers;

use App\Http\Requests\BankAccountRequest;
use App\Repositories\All\BankAccount\BankAccountInterface;

class BankAccountController extends Controller
{
    private BankAccountInterface $bankAccountRepository;

    public function __construct(BankAccountInterface $bankAccountRepository)
    {
        $this->bankAccountRepository = $bankAccountRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = $this->bankAccountRepository->all();
        return response()->json($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BankAccountRequest $request)
    {
        $data = $this->bankAccountRepository->create($request->validated());
        return response()->json(['message' => 'Bank Account created successfully', 'data' => $data], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $data = $this->bankAccountRepository->find($id);
        if (!$data) {
            return response()->json(['message' => 'Bank Account not found'], 404);
        }
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BankAccountRequest $request, string $id)
    {
        $updated = $this->bankAccountRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Update failed or Bank Account not found'], 404);
        }
        return response()->json(['message' => 'Bank Account updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->bankAccountRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Delete failed or Bank Account not found'], 404);
        }
        return response()->json(['message' => 'Bank Account deleted successfully']);
    }
}
