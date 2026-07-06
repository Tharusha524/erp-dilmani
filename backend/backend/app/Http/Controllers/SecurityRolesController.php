<?php

namespace App\Http\Controllers;

use App\Http\Requests\SecurityRolesRequest;
use App\Repositories\All\SecurityRoles\SecurityRolesInterface;

class SecurityRolesController extends Controller
{
    private SecurityRolesInterface $securityRoleRepo;

    public function __construct(SecurityRolesInterface $securityRoleRepo)
    {
        $this->securityRoleRepo = $securityRoleRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->securityRoleRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SecurityRolesRequest $request)
    {
        $data = $request->validated();
        $role = $this->securityRoleRepo->create($data);
        return response()->json($role, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $role = $this->securityRoleRepo->find($id);
        if (! $role) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($role, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SecurityRolesRequest $request, string $id)
    {
        $updated = $this->securityRoleRepo->update($id, $request->validated());
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
        $deleted = $this->securityRoleRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
