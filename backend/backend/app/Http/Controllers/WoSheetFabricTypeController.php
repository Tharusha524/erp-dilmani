<?php

namespace App\Http\Controllers;

use App\Models\WoSheetFabricType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetFabricTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(WoSheetFabricType::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_fabric_types,name',
        ]);

        return response()->json(WoSheetFabricType::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $fabricType = WoSheetFabricType::find($id);
        if (! $fabricType) {
            return response()->json(['message' => 'Fabric type not found'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_fabric_types,name,' . $id,
        ]);

        $fabricType->update($data);

        return response()->json($fabricType);
    }

    public function destroy(int $id): JsonResponse
    {
        $fabricType = WoSheetFabricType::find($id);
        if (! $fabricType) {
            return response()->json(['message' => 'Fabric type not found'], 404);
        }

        $fabricType->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
