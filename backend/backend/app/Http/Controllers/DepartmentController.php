<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartmentRequest;
use App\Repositories\All\Department\DepartmentInterface;

class DepartmentController extends Controller
{
    private DepartmentInterface $departmentRepo;

    public function __construct(DepartmentInterface $departmentRepo)
    {
        $this->departmentRepo = $departmentRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->departmentRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DepartmentRequest $request)
    {
        $data = $request->validated();
        $department = $this->departmentRepo->create($data);
        return response()->json($department, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $department = $this->departmentRepo->find($id);
        if (! $department) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($department, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DepartmentRequest $request, string $id)
    {
        $updated = $this->departmentRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Updated successfully'], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->departmentRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
