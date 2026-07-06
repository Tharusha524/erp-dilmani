<?php

namespace App\Http\Controllers;

use App\Services\Accounting\VoidTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoidTransactionController extends Controller
{
    public function __construct(
        private VoidTransactionService $voidService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $limit = min(500, max(50, (int) $request->input('limit', 200)));

        return response()->json($this->voidService->listRecent($limit));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trans_type' => 'required|integer',
            'trans_no' => 'required|integer',
            'voiding_date' => 'required|date',
            'memo' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->voidService->void(
                (int) $validated['trans_type'],
                (int) $validated['trans_no'],
                $validated['voiding_date'],
                $validated['memo'] ?? null
            );

            return response()->json($result);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
