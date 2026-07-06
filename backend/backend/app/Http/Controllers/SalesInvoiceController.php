<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostDirectSalesInvoiceRequest;
use App\Http\Requests\PostSalesInvoiceFromDeliveryRequest;
use App\Services\Sales\SalesInvoiceService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SalesInvoiceController extends Controller
{
    public function __construct(private SalesInvoiceService $invoiceService) {}

    public function invoiceFromDelivery(PostSalesInvoiceFromDeliveryRequest $request): JsonResponse
    {
        try {
            $result = $this->invoiceService->invoiceFromDelivery($request->validated());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to process sales invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function directInvoice(PostDirectSalesInvoiceRequest $request): JsonResponse
    {
        try {
            $result = $this->invoiceService->directInvoice($request->validated());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to process direct invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function directInvoiceFromTemplate(int $orderNo): JsonResponse
    {
        try {
            $result = $this->invoiceService->directInvoiceFromTemplate($orderNo, request()->all());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process template invoice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function prepaidFinalInvoice(int $orderNo): JsonResponse
    {
        try {
            $result = $this->invoiceService->prepaidFinalInvoice($orderNo, request()->all());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process prepaid final invoice.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            $result = $this->invoiceService->void($transNo, request()->input('memo'));

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to void sales invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->invoiceService->updatePosted($transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update sales invoice.', 'error' => $e->getMessage()], 500);
        }
    }
}
