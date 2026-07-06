<?php

namespace App\Http\Controllers;

use App\Http\Requests\GlTypeRequest;
use App\Repositories\All\GlType\GlTypeInterface;

class GlTypeController extends Controller
{
    private GlTypeInterface $glType;

    public function __construct(GlTypeInterface $glType)
    {
        $this->glType = $glType;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->glType->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(GlTypeRequest $request)
    {
        $data = $this->glType->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->glType->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(GlTypeRequest $request, string $id)
    {
        $this->glType->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->glType->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
