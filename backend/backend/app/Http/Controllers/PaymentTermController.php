<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentTermRequest;
use App\Repositories\All\PaymentTerm\PaymentTermInterface;

class PaymentTermController extends Controller
{
    private PaymentTermInterface $paymentTermRepo;

    public function __construct(PaymentTermInterface $paymentTermRepo)
    {
        $this->paymentTermRepo = $paymentTermRepo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->paymentTermRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PaymentTermRequest $request)
    {
        $paymentTerm = $this->paymentTermRepo->create($request->validated());
        return response()->json($paymentTerm, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $paymentTerm = $this->paymentTermRepo->find($id);

        if (!$paymentTerm) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($paymentTerm, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PaymentTermRequest $request, string $id)
    {
        $updated = $this->paymentTermRepo->update($id, $request->validated());

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
        $deleted = $this->paymentTermRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
