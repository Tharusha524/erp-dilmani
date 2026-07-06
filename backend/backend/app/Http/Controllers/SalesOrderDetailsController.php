<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesOrderDetailsRequest;
use App\Repositories\All\SalesOrderDetails\SalesOrderDetailsInterface;

class SalesOrderDetailsController extends Controller
{
    private SalesOrderDetailsInterface $repo;

    public function __construct(SalesOrderDetailsInterface $repo)
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
    public function store(SalesOrderDetailsRequest $request)
    {
        return response()->json($this->repo->create($request->validated()));
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
    public function update(SalesOrderDetailsRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());
        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->repo->delete($id);
        return response()->json(['message' => 'Deleted successfully']);
    }
}
