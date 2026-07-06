<?php

namespace App\Http\Controllers;

use App\Http\Requests\CrmPersonsRequest;
use App\Repositories\All\CrmPersons\CrmPersonsInterface;

class CrmPersonsController extends Controller
{
    private CrmPersonsInterface $crmPersonRepo;

    public function __construct(CrmPersonsInterface $crmPersonRepo)
    {
        $this->crmPersonRepo = $crmPersonRepo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->crmPersonRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CrmPersonsRequest $request)
    {
        $person = $this->crmPersonRepo->create($request->validated());
        return response()->json($person, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $person = $this->crmPersonRepo->find($id);
        if (!$person) {
            return response()->json(['message' => 'Person not found'], 404);
        }
        return response()->json($person);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CrmPersonsRequest $request, string $id)
    {
        $updated = $this->crmPersonRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Person not found'], 404);
        }
        return response()->json($this->crmPersonRepo->find($id));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->crmPersonRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Person not found'], 404);
        }
        return response()->json(['message' => 'Person deleted']);
    }
}
