<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostSupplierPaymentRequest;
use App\Services\Purchasing\PurchInquiryService;
use App\Services\Purchasing\SupplierPaymentService;
use App\Services\Purchasing\SupplierTransactionEditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class SupplierPaymentController extends Controller
{
    public function __construct(
        private SupplierPaymentService $payments,
        private PurchInquiryService $inquiry,
        private SupplierTransactionEditService $editService,
    ) {}

    public function allocatable(Request $request): JsonResponse
    {
        $supplierId = (int) $request->query('supplier_id', 0);

        return response()->json($this->inquiry->supplierPaymentAllocatable($supplierId));
    }

    public function store(PostSupplierPaymentRequest $request): JsonResponse
    {
        try {
            return response()->json($this->payments->create($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process supplier payment.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->payments->void($transNo, request()->input('memo')));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->editService->updateSuppDocument(22, $transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update supplier payment.', 'error' => $e->getMessage()], 500);
        }
    }
}
