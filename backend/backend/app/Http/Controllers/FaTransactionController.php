<?php

namespace App\Http\Controllers;

use App\Services\FixedAssets\FaTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaTransactionController extends Controller
{
    public function __construct(
        private FaTransactionService $faTransactions
    ) {}

    public function purchase(Request $request): JsonResponse
    {
        $request->merge([
            'loc_code' => trim((string) (
                $request->input('loc_code')
                ?: $request->input('locationCode')
                ?: $request->input('location_code')
            )),
        ]);

        $validated = $request->validate([
            'supplier_id' => 'required|integer',
            'loc_code' => 'required|string|max:5',
            'reference' => 'nullable|string|max:60',
            'supp_reference' => 'nullable|string|max:60',
            'trans_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'cost_center_id' => 'nullable|integer',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
            'lines.*.price' => 'required|numeric|min:0',
        ]);

        try {
            return response()->json($this->faTransactions->purchase(
                $request->only(['supplier_id', 'loc_code', 'reference', 'supp_reference', 'trans_date', 'due_date', 'cost_center_id']),
                $validated['lines']
            ));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function openingBalance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'loc_code' => 'required|string|max:5',
            'trans_date' => 'nullable|date',
            'reference' => 'nullable|string|max:40',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        try {
            return response()->json($this->faTransactions->openingBalance(
                $request->only(['loc_code', 'trans_date', 'reference']),
                $validated['lines']
            ));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_loc_code' => 'required|string|max:5',
            'to_loc_code' => 'required|string|max:5',
            'trans_date' => 'required|date',
            'reference' => 'nullable|string|max:40',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        try {
            return response()->json($this->faTransactions->transfer(
                $request->only(['from_loc_code', 'to_loc_code', 'trans_date', 'reference']),
                $validated['lines']
            ));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function disposal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'loc_code' => 'required|string|max:5',
            'trans_date' => 'required|date',
            'reference' => 'nullable|string|max:40',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        try {
            return response()->json($this->faTransactions->disposal(
                $request->only(['loc_code', 'trans_date', 'reference']),
                $validated['lines']
            ));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function sale(Request $request): JsonResponse
    {
        $request->merge([
            'loc_code' => trim((string) (
                $request->input('loc_code')
                ?: $request->input('locationCode')
                ?: $request->input('location_code')
            )),
        ]);

        $validated = $request->validate([
            'debtor_no' => 'required|integer',
            'branch_code' => 'nullable|integer',
            'loc_code' => 'nullable|string|max:5',
            'reference' => 'nullable|string|max:60',
            'invoice_reference' => 'nullable|string|max:60',
            'tran_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'cost_center_id' => 'nullable|integer',
            'lines' => 'required|array|min:1',
            'lines.*.stock_id' => 'required|string',
            'lines.*.quantity' => 'required|numeric|min:0.0001',
            'lines.*.price' => 'required|numeric|min:0',
            'lines.*.loc_code' => 'nullable|string|max:5',
            'lines.*.description' => 'nullable|string|max:200',
        ]);

        try {
            return response()->json($this->faTransactions->sale(
                $request->only(['debtor_no', 'branch_code', 'loc_code', 'reference', 'invoice_reference', 'tran_date', 'due_date', 'cost_center_id']),
                $validated['lines']
            ));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
