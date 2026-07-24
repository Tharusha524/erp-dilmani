<?php

namespace App\Http\Controllers;

use App\Models\WoSheetStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetStatusController extends Controller
{
    /**
     * List all statuses, grouped implicitly by category + process_type
     * (ordered so the frontend can just group by those two fields).
     */
    public function index(): JsonResponse
    {
        $statuses = WoSheetStatus::orderBy('category')
            ->orderBy('process_type')
            ->orderBy('sequence_order')
            ->get();

        return response()->json($statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:50',
            'process_type' => 'required|string|in:normal,bulk',
            'sequence_order' => 'required|integer|min:0',
            'inactive' => 'sometimes|boolean',
        ]);

        $status = WoSheetStatus::create($data);

        return response()->json($status, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $status = WoSheetStatus::find($id);
        if (! $status) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:50',
            'process_type' => 'sometimes|string|in:normal,bulk',
            'sequence_order' => 'sometimes|integer|min:0',
            'inactive' => 'sometimes|boolean',
        ]);

        $status->update($data);

        return response()->json($status);
    }

    public function destroy(int $id): JsonResponse
    {
        $status = WoSheetStatus::find($id);
        if (! $status) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        $status->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
