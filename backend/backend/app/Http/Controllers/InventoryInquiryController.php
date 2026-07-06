<?php

namespace App\Http\Controllers;

use App\Services\Inventory\InventoryInquiryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryInquiryController extends Controller
{
    public function __construct(private InventoryInquiryService $inquiry) {}

    public function itemMovements(Request $request): JsonResponse
    {
        $request->validate([
            'stock_id' => 'required|string|max:20',
            'loc_code' => 'nullable|string|max:20',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);

        return response()->json($this->inquiry->itemMovements($request->all()));
    }

    public function itemStatus(Request $request, string $stockId): JsonResponse
    {
        return response()->json($this->inquiry->itemStatus($stockId));
    }
}
