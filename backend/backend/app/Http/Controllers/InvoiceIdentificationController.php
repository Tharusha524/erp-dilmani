<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoiceIdentificationRequest;
use App\Repositories\All\InvoiceIdentification\InvoiceIdentificationInterface;

class InvoiceIdentificationController extends Controller
{
    private InvoiceIdentificationInterface $invoiceIdentification;

    public function __construct(InvoiceIdentificationInterface $invoiceIdentification)
    {
        $this->invoiceIdentification = $invoiceIdentification;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->invoiceIdentification->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(InvoiceIdentificationRequest $request)
    {
        $data = $this->invoiceIdentification->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->invoiceIdentification->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InvoiceIdentificationRequest $request, string $id)
    {
        $this->invoiceIdentification->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->invoiceIdentification->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
