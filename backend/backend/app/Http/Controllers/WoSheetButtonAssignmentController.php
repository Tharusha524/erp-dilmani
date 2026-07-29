<?php

namespace App\Http\Controllers;

use App\Models\WoSheetButtonAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetButtonAssignmentController extends Controller
{
    /**
     * List every button assignment (button_key -> user_id), with the
     * assigned user's name joined in for display.
     */
    public function index(): JsonResponse
    {
        $assignments = WoSheetButtonAssignment::query()
            ->leftJoin('user_managements', 'user_managements.id', '=', 'wo_sheet_button_assignments.user_id')
            ->select([
                'wo_sheet_button_assignments.id',
                'wo_sheet_button_assignments.button_key',
                'wo_sheet_button_assignments.user_id',
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
     * Add a user to a button's list of authorized people. Multiple users
     * may be assigned to the same button, so this adds rather than upserts.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'button_key' => 'required|string|in:finish,verify,reopen,hand_over',
            'user_id' => 'required|integer|exists:user_managements,id',
        ]);

        $assignment = WoSheetButtonAssignment::firstOrCreate([
            'button_key' => $data['button_key'],
            'user_id' => $data['user_id'],
        ]);

        return response()->json($assignment, 201);
    }

    public function destroy(string $buttonKey, int $userId): JsonResponse
    {
        $deleted = WoSheetButtonAssignment::where('button_key', $buttonKey)
            ->where('user_id', $userId)
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        return response()->json(['message' => 'Unassigned successfully']);
    }
}
