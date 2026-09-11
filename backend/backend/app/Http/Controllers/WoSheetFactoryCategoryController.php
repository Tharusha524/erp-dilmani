<?php

namespace App\Http\Controllers;

use App\Models\WoSheetFactoryCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetFactoryCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(WoSheetFactoryCategory::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_factory_categories,name',
        ]);

        return response()->json(WoSheetFactoryCategory::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = WoSheetFactoryCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Factory category not found'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_factory_categories,name,' . $id,
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = WoSheetFactoryCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Factory category not found'], 404);
        }

        $category->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
