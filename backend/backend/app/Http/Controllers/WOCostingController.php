<?php

namespace App\Http\Controllers;

use App\Http\Requests\WOCostingRequest;
use App\Repositories\All\WOCosting\WOCostingInterface;

class WOCostingController extends Controller
{
    protected WOCostingInterface $repo;

    public function __construct(WOCostingInterface $repo)
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
    public function store(WOCostingRequest $request)
    {
        return response()->json(
            $this->repo->create($request->validated()),
            201
        );
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
    public function update(WOCostingRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        return response()->json([
            'success' => $updated
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return response()->json([
            'success' => $this->repo->delete($id)
        ]);
    }

    public function byWorkorder($workorderId)
    {
        return response()->json(
            $this->repo->getByWorkorder($workorderId)
        );
    }
}
