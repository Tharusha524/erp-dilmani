<?php

namespace App\Http\Controllers;

use App\Models\PosShift;
use App\Models\PosShiftFloatMovement;
use Illuminate\Http\Request;

class PosShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = PosShift::with(['user:id,first_name,last_name', 'salesPos:id,pos_name'])->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:user_managements,id',
            'sales_pos_id' => 'nullable|exists:sales_pos,id',
            'opening_float' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $existingOpen = PosShift::where('user_id', $data['user_id'])->where('status', 'open')->first();
        if ($existingOpen) {
            return response()->json(['message' => 'This user already has an open shift', 'shift' => $existingOpen], 422);
        }

        $data['shift_start'] = now();
        $data['status'] = 'open';

        $shift = PosShift::create($data);
        return response()->json($shift, 201);
    }

    public function show(string $id)
    {
        $shift = PosShift::with(['user:id,first_name,last_name', 'salesPos:id,pos_name'])->find($id);
        if (!$shift) {
            return response()->json(['message' => 'Shift not found'], 404);
        }
        return response()->json($shift);
    }

    /**
     * Close a shift: record counted cash, compute variance against expected.
     */
    public function close(Request $request, string $id)
    {
        $shift = PosShift::find($id);
        if (!$shift) {
            return response()->json(['message' => 'Shift not found'], 404);
        }
        if ($shift->status === 'closed') {
            return response()->json(['message' => 'Shift already closed'], 422);
        }

        $data = $request->validate([
            'closing_expected' => 'required|numeric',
            'closing_counted' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $shift->closing_expected = $data['closing_expected'];
        $shift->closing_counted = $data['closing_counted'];
        $shift->variance = $data['closing_counted'] - $data['closing_expected'];
        $shift->notes = $data['notes'] ?? $shift->notes;
        $shift->shift_end = now();
        $shift->status = 'closed';
        $shift->save();

        return response()->json($shift);
    }

    /**
     * Record a Cash In or Cash Out movement against an open shift.
     * Only updates the drawer float log — no GL entries, no accounting impact.
     */
    public function floatMovement(Request $request, string $id)
    {
        $shift = PosShift::find($id);
        if (!$shift) {
            return response()->json(['message' => 'Shift not found'], 404);
        }
        if ($shift->status !== 'open') {
            return response()->json(['message' => 'Cannot record movement on a closed shift'], 422);
        }

        $data = $request->validate([
            'type'        => 'required|in:cash_in,cash_out',
            'amount'      => 'required|numeric|min:0.01',
            'reason'      => 'nullable|string|max:255',
            'recorded_by' => 'nullable|exists:user_managements,id',
        ]);

        $movement = PosShiftFloatMovement::create([
            'pos_shift_id' => $shift->id,
            'type'         => $data['type'],
            'amount'       => $data['amount'],
            'reason'       => $data['reason'] ?? null,
            'recorded_by'  => $data['recorded_by'] ?? null,
        ]);

        return response()->json($movement, 201);
    }

    /**
     * List all Cash In/Out movements for a shift.
     */
    public function floatMovements(string $id)
    {
        $shift = PosShift::find($id);
        if (!$shift) {
            return response()->json(['message' => 'Shift not found'], 404);
        }

        $movements = PosShiftFloatMovement::where('pos_shift_id', $id)
            ->with('recordedBy:id,first_name,last_name')
            ->orderBy('created_at')
            ->get();

        return response()->json($movements);
    }
}
