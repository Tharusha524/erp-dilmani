<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepreciationPeriodRequest;
use App\Repositories\All\DepreciationPeriod\DepreciationPeriodInterface;

class DepreciationPeriodController extends Controller
{
    private DepreciationPeriodInterface $depreciationPeriod;
    public function __construct(DepreciationPeriodInterface $depreciationPeriod)
    {
        $this->depreciationPeriod = $depreciationPeriod;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->depreciationPeriod->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DepreciationPeriodRequest $request)
    {
        $data = $this->depreciationPeriod->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->depreciationPeriod->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DepreciationPeriodRequest $request, string $id)
    {
        $this->depreciationPeriod->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->depreciationPeriod->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
