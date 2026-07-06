<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepreciationMethodRequest;
use App\Repositories\All\DepreciationMethod\DepreciationMethodInterface;

class DepreciationMethodController extends Controller
{
    private DepreciationMethodInterface $depreciationMethod;
    public function __construct(DepreciationMethodInterface $depreciationMethod)
    {
        $this->depreciationMethod = $depreciationMethod;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->depreciationMethod->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DepreciationMethodRequest $request)
    {
        $data = $this->depreciationMethod->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id)
    {
        return response()->json($this->depreciationMethod->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DepreciationMethodRequest $request, int $id)
    {
        $this->depreciationMethod->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $this->depreciationMethod->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
