<?php

namespace App\Http\Controllers;

use App\Http\Requests\WORequirementsRequest;
use App\Repositories\All\WORequirements\WORequirementsInterface;
use Illuminate\Http\Request;

class WORequirementsController extends Controller
{
    private WORequirementsInterface $woRequirements;

    public function __construct(WORequirementsInterface $woRequirements)
    {
        $this->woRequirements = $woRequirements;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->woRequirements->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(WORequirementsRequest $request)
    {
        $record = $this->woRequirements->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->woRequirements->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(WORequirementsRequest $request, string $id)
    {
        $this->woRequirements->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->woRequirements->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
