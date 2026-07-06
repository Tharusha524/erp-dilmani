<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecurrentInvoiceRequest;
use App\Repositories\All\RecurrentInvoice\RecurrentInvoiceInterface;
use App\Services\Sales\RecurrentInvoiceService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class RecurrentInvoiceController extends Controller
{
    private RecurrentInvoiceInterface $recurrentInvoice;

    public function __construct(
        RecurrentInvoiceInterface $recurrentInvoice,
        private RecurrentInvoiceService $generator,
    ) {
        $this->recurrentInvoice = $recurrentInvoice;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->recurrentInvoice->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RecurrentInvoiceRequest $request)
    {
        $recurrentInvoice = $this->recurrentInvoice->create($request->validated());
        return response()->json($recurrentInvoice, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->recurrentInvoice->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RecurrentInvoiceRequest $request, string $id)
    {
        $this->recurrentInvoice->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->recurrentInvoice->delete($id);
        return response()->json(['message' => 'Deleted']);
    }

    public function generate(string $id): JsonResponse
    {
        try {
            return response()->json(
                $this->generator->generate((int) $id, request()->input('invoice_date')),
                201
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to generate recurrent invoice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function generateAllDue(): JsonResponse
    {
        try {
            return response()->json(
                $this->generator->generateAllDue(request()->input('as_of_date')),
                201
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to generate due recurrent invoices.', 'error' => $e->getMessage()], 500);
        }
    }
}
