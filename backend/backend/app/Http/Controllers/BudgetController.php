<?php

namespace App\Http\Controllers;

use App\Models\BudgetTrans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'fiscal_year_id' => 'required|integer',
            'account' => 'required|string|max:15',
            'dimension_id' => 'nullable|integer',
            'dimension2_id' => 'nullable|integer',
        ]);

        $rows = BudgetTrans::query()
            ->where('fiscal_year_id', $request->integer('fiscal_year_id'))
            ->where('account', $request->input('account'))
            ->where('dimension_id', $request->integer('dimension_id', 0))
            ->where('dimension2_id', $request->integer('dimension2_id', 0))
            ->orderBy('tran_date')
            ->get();

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fiscal_year_id' => 'required|integer',
            'account' => 'required|string|max:15',
            'dimension_id' => 'nullable|integer',
            'dimension2_id' => 'nullable|integer',
            'periods' => 'required|array|min:1',
            'periods.*.tran_date' => 'required|date',
            'periods.*.amount' => 'nullable|numeric',
        ]);

        $dimensionId = (int) ($validated['dimension_id'] ?? 0);
        $dimension2Id = (int) ($validated['dimension2_id'] ?? 0);
        $saved = [];

        foreach ($validated['periods'] as $period) {
            $amount = round((float) ($period['amount'] ?? 0), 2);
            $row = BudgetTrans::updateOrCreate(
                [
                    'fiscal_year_id' => $validated['fiscal_year_id'],
                    'account' => $validated['account'],
                    'dimension_id' => $dimensionId,
                    'dimension2_id' => $dimension2Id,
                    'tran_date' => $period['tran_date'],
                ],
                ['amount' => $amount]
            );
            $saved[] = $row;
        }

        return response()->json(['message' => 'Budget saved.', 'rows' => $saved]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'fiscal_year_id' => 'required|integer',
            'account' => 'required|string|max:15',
            'dimension_id' => 'nullable|integer',
            'dimension2_id' => 'nullable|integer',
        ]);

        BudgetTrans::query()
            ->where('fiscal_year_id', $request->integer('fiscal_year_id'))
            ->where('account', $request->input('account'))
            ->where('dimension_id', $request->integer('dimension_id', 0))
            ->where('dimension2_id', $request->integer('dimension2_id', 0))
            ->delete();

        return response()->json(['message' => 'Budget deleted for account.']);
    }
}
