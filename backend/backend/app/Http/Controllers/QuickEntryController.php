<?php

namespace App\Http\Controllers;

use App\Models\QuickEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuickEntryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(QuickEntry::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:60',
            'description' => 'nullable|string|max:120',
            'usage' => 'nullable|string|max:255',
            'entry_type' => 'nullable|string|max:40',
            'base_amount_description' => 'nullable|string|max:120',
            'default_base_amount' => 'nullable|numeric',
            'destination_account' => 'nullable|string|max:15',
        ]);

        $row = QuickEntry::create($data);

        return response()->json($row, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(QuickEntry::findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = QuickEntry::findOrFail($id);
        $row->update($request->validate([
            'name' => 'sometimes|string|max:60',
            'description' => 'nullable|string|max:120',
            'usage' => 'nullable|string|max:255',
            'entry_type' => 'nullable|string|max:40',
            'base_amount_description' => 'nullable|string|max:120',
            'default_base_amount' => 'nullable|numeric',
            'destination_account' => 'nullable|string|max:15',
        ]));

        return response()->json($row);
    }

    public function destroy(int $id): JsonResponse
    {
        QuickEntry::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
