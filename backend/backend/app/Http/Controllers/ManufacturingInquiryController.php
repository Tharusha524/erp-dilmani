<?php

namespace App\Http\Controllers;

use App\Services\Manufacturing\ManufacturingInquiryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManufacturingInquiryController extends Controller
{
    public function __construct(private ManufacturingInquiryService $inquiry) {}

    public function workOrders(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->searchWorkOrders($request->all()));
    }

    public function costedBom(Request $request): JsonResponse
    {
        $stockId = trim((string) $request->query('stock_id', ''));
        if ($stockId === '') {
            return response()->json(['message' => 'stock_id is required'], 422);
        }

        return response()->json($this->inquiry->costedBom($stockId));
    }

    public function whereUsed(Request $request): JsonResponse
    {
        $stockId = trim((string) $request->query('stock_id', ''));
        if ($stockId === '') {
            return response()->json(['message' => 'stock_id is required'], 422);
        }

        return response()->json($this->inquiry->whereUsed($stockId));
    }
}
