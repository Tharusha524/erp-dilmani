<?php

namespace App\Http\Controllers;

use App\Services\Inventory\InventoryTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class InventoryTransactionController extends Controller
{
    public function __construct(private InventoryTransactionService $inventory) {}

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_loc_code' => 'required|string|max:20',
            'to_loc_code' => 'required|string|max:20',
            'trans_date' => 'required|date',
            'reference' => 'nullable|string|max:40',
            'comments' => 'nullable|string|max:1000',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string|max:20',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        try {
            return response()->json($this->inventory->transfer($validated, $validated['lines']), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post inventory transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function adjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'loc_code' => 'required|string|max:20',
            'trans_date' => 'required|date',
            'reference' => 'nullable|string|max:40',
            'comments' => 'nullable|string|max:1000',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string|max:20',
            'lines.*.quantity' => 'required|numeric|not_in:0',
            'lines.*.standard_cost' => 'nullable|numeric|min:0',
        ]);

        try {
            return response()->json($this->inventory->adjustment($validated, $validated['lines']), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post inventory adjustment.', 'error' => $e->getMessage()], 500);
        }
    }

    public function showTransfer(int $transNo): JsonResponse
    {
        $data = $this->inventory->showTransfer($transNo);
        if (! $data) {
            return response()->json(['message' => 'Inventory transfer not found.'], 404);
        }

        return response()->json($data);
    }

    public function showAdjustment(int $transNo): JsonResponse
    {
        $data = $this->inventory->showAdjustment($transNo);
        if (! $data) {
            return response()->json(['message' => 'Inventory adjustment not found.'], 404);
        }

        return response()->json($data);
    }
}
