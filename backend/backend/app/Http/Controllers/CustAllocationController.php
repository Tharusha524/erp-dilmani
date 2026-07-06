<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustAllocationRequest;
use App\Repositories\All\CustAllocation\CustAllocationInterface;

class CustAllocationController extends Controller
{
    private CustAllocationInterface $custAllocation;
    public function __construct(CustAllocationInterface $custAllocation)
    {
        $this->custAllocation = $custAllocation;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->custAllocation->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CustAllocationRequest $request)
    {
        $data = $this->custAllocation->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id)
    {
        return response()->json($this->custAllocation->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CustAllocationRequest $request, int $id)
    {
        $this->custAllocation->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $this->custAllocation->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
