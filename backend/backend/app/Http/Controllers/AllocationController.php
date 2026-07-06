<?php

namespace App\Http\Controllers;

use App\Services\Accounting\AllocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AllocationController extends Controller
{
    public function __construct(
        private AllocationService $allocationService
    ) {}

    public function customerOpen(int $transNo, int $transType): JsonResponse
    {
        try {
            return response()->json(
                $this->allocationService->customerOpenItems($transNo, $transType)
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function supplierOpen(int $transNo, int $transType): JsonResponse
    {
        try {
            return response()->json(
                $this->allocationService->supplierOpenItems($transNo, $transType)
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function processCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trans_no_from' => 'required|integer',
            'trans_type_from' => 'required|integer',
            'date_alloc' => 'required|date',
            'lines' => 'required|array|min:1',
            'lines.*.trans_no_to' => 'required|integer',
            'lines.*.trans_type_to' => 'required|integer',
            'lines.*.amt' => 'required|numeric|min:0',
        ]);

        try {
            return response()->json(
                $this->allocationService->processCustomerAllocations(
                    (int) $validated['trans_no_from'],
                    (int) $validated['trans_type_from'],
                    $validated['date_alloc'],
                    $validated['lines']
                )
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function processSupplier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trans_no_from' => 'required|integer',
            'trans_type_from' => 'required|integer',
            'date_alloc' => 'required|date',
            'lines' => 'required|array|min:1',
            'lines.*.trans_no_to' => 'required|integer',
            'lines.*.trans_type_to' => 'required|integer',
            'lines.*.amt' => 'required|numeric|min:0',
        ]);

        try {
            return response()->json(
                $this->allocationService->processSupplierAllocations(
                    (int) $validated['trans_no_from'],
                    (int) $validated['trans_type_from'],
                    $validated['date_alloc'],
                    $validated['lines']
                )
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
