<?php

namespace App\Http\Controllers;

use App\Models\AppExtension;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppExtensionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AppExtension::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'extension_key' => 'required|string|max:60|unique:app_extensions,extension_key',
            'name' => 'required|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]);

        return response()->json(AppExtension::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = AppExtension::findOrFail($id);
        $row->update($request->validate([
            'name' => 'sometimes|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]));

        return response()->json($row);
    }

    public function destroy(int $id): JsonResponse
    {
        AppExtension::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
