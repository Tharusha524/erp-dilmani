<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkCentreRequest;
use App\Repositories\All\WorkCentre\WorkCentreInterface;

class WorkCentreController extends Controller
{   
    private WorkCentreInterface $repo;

    public function __construct(WorkCentreInterface $repo)
    {
        $this->repo = $repo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all(), 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(WorkCentreRequest $request)
    {
        $workCentre = $this->repo->create($request->validated());
        return response()->json($workCentre, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $workCentre = $this->repo->find($id);

        if (!$workCentre) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($workCentre, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(WorkCentreRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Updated successfully'], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
