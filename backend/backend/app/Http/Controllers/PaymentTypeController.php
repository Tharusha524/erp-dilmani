<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentTypeRequest;
use App\Repositories\All\PaymentType\PaymentTypeInterface;

class PaymentTypeController extends Controller
{
    private PaymentTypeInterface $paymentTypeRepository;

    public function __construct(PaymentTypeInterface $paymentTypeRepository)
    {
        $this->paymentTypeRepository = $paymentTypeRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $data = $this->paymentTypeRepository->all();
        return response()->json($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PaymentTypeRequest $request)
    {
        $data = $this->paymentTypeRepository->create($request->validated());
        return response()->json(['message' => 'Payment Type created successfully', 'data' => $data], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $data = $this->paymentTypeRepository->find($id);
        if (!$data) {
            return response()->json(['message' => 'Payment Type not found'], 404);
        }
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PaymentTypeRequest $request, string $id)
    {
        $updated = $this->paymentTypeRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Update failed or Payment Type not found'], 404);
        }
        return response()->json(['message' => 'Payment Type updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->paymentTypeRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Delete failed or Payment Type not found'], 404);
        }
        return response()->json(['message' => 'Payment Type deleted successfully']);
    }
}
