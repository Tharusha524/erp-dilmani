<?php

namespace App\Http\Controllers;

use App\Models\WoSheetBranch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WoSheetBranchController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(WoSheetBranch::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_branches,name',
        ]);

        return response()->json(WoSheetBranch::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $branch = WoSheetBranch::find($id);
        if (! $branch) {
            return response()->json(['message' => 'Branch not found'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:100|unique:wo_sheet_branches,name,' . $id,
        ]);

        $branch->update($data);

        return response()->json($branch);
    }

    public function destroy(int $id): JsonResponse
    {
        $branch = WoSheetBranch::find($id);
        if (! $branch) {
            return response()->json(['message' => 'Branch not found'], 404);
        }

        $branch->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
