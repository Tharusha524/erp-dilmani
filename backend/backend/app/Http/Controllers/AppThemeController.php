<?php

namespace App\Http\Controllers;

use App\Models\AppTheme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppThemeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AppTheme::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'theme_key' => 'required|string|max:60|unique:app_themes,theme_key',
            'name' => 'required|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]);

        return response()->json(AppTheme::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = AppTheme::findOrFail($id);
        $row->update($request->validate([
            'name' => 'sometimes|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]));

        return response()->json($row);
    }

    public function destroy(int $id): JsonResponse
    {
        AppTheme::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
