<?php

namespace App\Http\Controllers;

use App\Repositories\All\SalesArea\SalesAreaInterface;
use App\Http\Requests\SalesAreaRequest;
use Illuminate\Http\Request;

class SalesAreaController extends Controller
{
    private SalesAreaInterface $repo;

    public function __construct(SalesAreaInterface $repo)
    {
        $this->repo = $repo;
    }

    public function index()
    {
        return response()->json($this->repo->all());
    }

    public function store(SalesAreaRequest $request)
    {
        $salesArea = $this->repo->create($request->validated());
        return response()->json($salesArea, 201);
    }

    public function show(int $id)
    {
        $salesArea = $this->repo->find($id);
        if (!$salesArea) return response()->json(['message' => 'Sales area not found'], 404);

        return response()->json($salesArea);
    }

    public function update(SalesAreaRequest $request, int $id)
    {
        $updated = $this->repo->update($id, $request->validated());
        if (!$updated) return response()->json(['message' => 'Sales area not found'], 404);

        return response()->json($this->repo->find($id));
    }

    public function destroy(int $id)
    {
        $deleted = $this->repo->delete($id);
        if (!$deleted) return response()->json(['message' => 'Sales area not found'], 404);

        return response()->json(['message' => 'Sales area deleted successfully']);
    }
}
