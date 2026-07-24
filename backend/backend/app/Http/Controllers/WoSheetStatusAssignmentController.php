<?php

namespace App\Http\Controllers;

use App\Models\WoSheetStatusAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetStatusAssignmentController extends Controller
{
    /**
     * List every status assignment (status_id -> user_id), with the
     * assigned user's name joined in for display.
     */
    public function index(): JsonResponse
    {
        $assignments = WoSheetStatusAssignment::query()
            ->leftJoin('user_managements', 'user_managements.id', '=', 'wo_sheet_status_assignments.user_id')
            ->select([
                'wo_sheet_status_assignments.id',
                'wo_sheet_status_assignments.status_id',
                'wo_sheet_status_assignments.user_id',
                'user_managements.first_name',
                'user_managements.last_name',
            ])
            ->get()
            ->map(function ($row) {
                $row->user_name = trim(($row->first_name ?? '') . ' ' . ($row->last_name ?? ''));
                unset($row->first_name, $row->last_name);
                return $row;
            });

        return response()->json($assignments);
    }

    /**
     * Assign (or reassign) the responsible user for a status. One status
     * has exactly one responsible user, so this upserts by status_id.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status_id' => 'required|integer|exists:wo_sheet_statuses,id',
            'user_id' => 'required|integer|exists:user_managements,id',
        ]);

        $assignment = WoSheetStatusAssignment::updateOrCreate(
            ['status_id' => $data['status_id']],
            ['user_id' => $data['user_id']]
        );

        return response()->json($assignment, 201);
    }

    public function destroy(int $statusId): JsonResponse
    {
        $deleted = WoSheetStatusAssignment::where('status_id', $statusId)->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        return response()->json(['message' => 'Unassigned successfully']);
    }
}
