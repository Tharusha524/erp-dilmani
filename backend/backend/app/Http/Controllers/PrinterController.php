<?php

namespace App\Http\Controllers;

use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrinterController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Printer::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:60',
            'description' => 'nullable|string|max:120',
            'host' => 'nullable|string|max:120',
            'port' => 'nullable|string|max:20',
            'queue' => 'nullable|string|max:60',
            'timeout' => 'nullable|integer|min:1',
        ]);

        return response()->json(Printer::create($data), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Printer::findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = Printer::findOrFail($id);
        $row->update($request->validate([
            'name' => 'sometimes|string|max:60',
            'description' => 'nullable|string|max:120',
            'host' => 'nullable|string|max:120',
            'port' => 'nullable|string|max:20',
            'queue' => 'nullable|string|max:60',
            'timeout' => 'nullable|integer|min:1',
        ]));

        return response()->json($row);
    }

    public function destroy(int $id): JsonResponse
    {
        Printer::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
