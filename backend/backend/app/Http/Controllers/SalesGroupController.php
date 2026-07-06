<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesGroupRequest;
use App\Repositories\All\SalesGroup\SalesGroupInterface;

class SalesGroupController extends Controller
{
    protected SalesGroupInterface $salesGroupRepo;

    public function __construct(SalesGroupInterface $salesGroupRepo)
    {
        $this->salesGroupRepo = $salesGroupRepo;
    }

    public function index()
    {
        $salesGroups = $this->salesGroupRepo->all();
        return response()->json($salesGroups);
    }

    public function store(SalesGroupRequest $request)
    {
        $salesGroup = $this->salesGroupRepo->create($request->validated());
        return response()->json($salesGroup, 201);
    }

    public function show(string $id)
    {
        $salesGroup = $this->salesGroupRepo->find($id);
        if (!$salesGroup) {
            return response()->json(['message' => 'Sales group not found'], 404);
        }
        return response()->json($salesGroup);
    }

    public function update(SalesGroupRequest $request, string $id)
    {
        $updated = $this->salesGroupRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Sales group not found'], 404);
        }
        return response()->json($this->salesGroupRepo->find($id));
    }

    public function destroy(string $id)
    {
        $deleted = $this->salesGroupRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Sales group not found'], 404);
        }
        return response()->json(['message' => 'Sales group deleted successfully']);
    }
}
