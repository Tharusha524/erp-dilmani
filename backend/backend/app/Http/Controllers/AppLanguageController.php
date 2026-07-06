<?php

namespace App\Http\Controllers;

use App\Models\AppLanguage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppLanguageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AppLanguage::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:10|unique:app_languages,code',
            'name' => 'required|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]);

        return response()->json(AppLanguage::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = AppLanguage::findOrFail($id);
        $row->update($request->validate([
            'name' => 'sometimes|string|max:80',
            'version' => 'nullable|string|max:20',
            'installed' => 'boolean',
        ]));

        return response()->json($row);
    }

    public function destroy(int $id): JsonResponse
    {
        AppLanguage::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
