<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuditTrailRequest;
use App\Repositories\All\AuditTrail\AuditTrailInterface;
use Illuminate\Http\JsonResponse;

class AuditTrailController extends Controller
{
    private AuditTrailInterface $auditRepo;

    public function __construct(AuditTrailInterface $auditRepo)
    {
        $this->auditRepo = $auditRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->auditRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AuditTrailRequest $request): JsonResponse
    {
        $record = $this->auditRepo->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $record = $this->auditRepo->find($id);
        if (! $record) {
            return response()->json(['message' => 'Audit record not found'], 404);
        }
        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(AuditTrailRequest $request, string $id): JsonResponse
    {
        $updated = $this->auditRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Update failed or record not found'], 404);
        }
        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->auditRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Delete failed or record not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
