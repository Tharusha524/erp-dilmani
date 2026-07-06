<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchOrderDetailsRequest;
use App\Repositories\All\PurchOrderDetails\PurchOrderDetailsInterface;
use Illuminate\Http\Request;

class PurchOrderDetailsController extends Controller
{
    private PurchOrderDetailsInterface $purchOrderDetails;

    public function __construct(PurchOrderDetailsInterface $purchOrderDetails)
    {
        $this->purchOrderDetails = $purchOrderDetails;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->purchOrderDetails->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PurchOrderDetailsRequest $request)
    {
        $record = $this->purchOrderDetails->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->purchOrderDetails->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PurchOrderDetailsRequest $request, string $id)
    {
        $this->purchOrderDetails->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->purchOrderDetails->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
