<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostSupplierCreditNoteRequest;
use App\Http\Requests\PostSupplierInvoiceDirectRequest;
use App\Http\Requests\PostSupplierInvoiceFromGrnRequest;
use App\Services\Purchasing\SupplierInvoiceService;
use App\Services\Purchasing\SupplierTransactionEditService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SupplierInvoiceController extends Controller
{
    public function __construct(
        private SupplierInvoiceService $invoices,
        private SupplierTransactionEditService $editService,
    ) {}

    public function invoiceFromGrn(PostSupplierInvoiceFromGrnRequest $request): JsonResponse
    {
        try {
            return response()->json($this->invoices->invoiceFromGrn($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post supplier invoice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function directInvoice(PostSupplierInvoiceDirectRequest $request): JsonResponse
    {
        try {
            return response()->json($this->invoices->directInvoice($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post direct supplier invoice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->invoices->void($transNo, request()->input('memo')));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->editService->updateSuppDocument(20, $transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update supplier invoice.', 'error' => $e->getMessage()], 500);
        }
    }
}
