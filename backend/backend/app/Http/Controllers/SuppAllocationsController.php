<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuppAllocationsRequest;
use App\Repositories\All\SuppAllocations\SuppAllocationsInterface;

class SuppAllocationsController extends Controller
{
    private SuppAllocationsInterface $repo;

    public function __construct(SuppAllocationsInterface $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SuppAllocationsRequest $request)
    {
        $record = $this->repo->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->repo->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SuppAllocationsRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->repo->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
