<?php

namespace App\Http\Controllers;

use App\Services\Purchasing\PurchInquiryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchInquiryController extends Controller
{
    public function __construct(private PurchInquiryService $inquiry) {}

    public function orders(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->purchaseOrders($request->all()));
    }

    public function supplierTransactions(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->supplierTransactions($request->all()));
    }

    public function supplierAllocations(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->supplierAllocations($request->all()));
    }

    public function openGrnItems(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->openGrnItems($request->all()));
    }
}
