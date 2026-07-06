<?php

namespace App\Http\Controllers;

use App\Services\Sales\SalesInquiryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesInquiryController extends Controller
{
    public function __construct(private SalesInquiryService $inquiry) {}

    public function quotations(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->salesQuotations($request->all()));
    }

    public function orders(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->salesOrders($request->all()));
    }

    public function customerTransactions(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->customerTransactions($request->all()));
    }

    public function customerAllocations(Request $request): JsonResponse
    {
        return response()->json($this->inquiry->customerAllocations($request->all()));
    }
}
