<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesPersonRequest;
use App\Repositories\All\SalesPerson\SalesPersonInterface;

class SalesPersonController extends Controller
{
    private SalesPersonInterface $salesPersonRepo;

    public function __construct(SalesPersonInterface $salesPersonRepo)
    {
        $this->salesPersonRepo = $salesPersonRepo;
    }

    public function index()
    {
        return response()->json($this->salesPersonRepo->all(), 200);
    }

    public function store(SalesPersonRequest $request)
    {
        $salesPerson = $this->salesPersonRepo->create($request->validated());
        return response()->json($salesPerson, 201);
    }

    public function show($id)
    {
        $salesPerson = $this->salesPersonRepo->find($id);

        if (!$salesPerson) {
            return response()->json(['message' => 'Sales person not found'], 404);
        }

        return response()->json($salesPerson, 200);
    }

    public function update(SalesPersonRequest $request, $id)
    {
        $updated = $this->salesPersonRepo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Sales person not found'], 404);
        }

        return response()->json(['message' => 'Sales person updated successfully'], 200);
    }

    public function destroy($id)
    {
        $deleted = $this->salesPersonRepo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Sales person not found'], 404);
        }

        return response()->json(['message' => 'Sales person deleted successfully'], 200);
    }
}
