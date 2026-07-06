<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostCustomerPaymentRequest;
use App\Services\Sales\SalesPaymentService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SalesPaymentController extends Controller
{
    public function __construct(private SalesPaymentService $payments) {}

    public function store(PostCustomerPaymentRequest $request): JsonResponse
    {
        try {
            return response()->json($this->payments->create($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process payment.', 'error' => $e->getMessage()], 500);
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
            return response()->json($this->payments->updatePosted($transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update payment.', 'error' => $e->getMessage()], 500);
        }
    }
}
