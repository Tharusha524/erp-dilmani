<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostDirectSalesDeliveryRequest;
use App\Http\Requests\PostSalesDeliveryRequest;
use App\Services\Sales\SalesDeliveryService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SalesDeliveryController extends Controller
{
    public function __construct(private SalesDeliveryService $deliveryService) {}

    public function dispatch(PostSalesDeliveryRequest $request): JsonResponse
    {
        try {
            $result = $this->deliveryService->dispatch($request->validated());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to process delivery dispatch.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function directDispatch(PostDirectSalesDeliveryRequest $request): JsonResponse
    {
        try {
            $result = $this->deliveryService->dispatchDirect($request->validated());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to process direct delivery.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function dispatchTemplate(int $orderNo): JsonResponse
    {
        try {
            $result = $this->deliveryService->dispatchFromTemplate($orderNo, request()->all());

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to process template delivery.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $transNo): JsonResponse
    {
        try {
            $result = $this->deliveryService->void($transNo, request()->input('memo'));

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to void delivery note.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(int $transNo): JsonResponse
    {
        try {
            return response()->json($this->deliveryService->updatePosted($transNo, request()->all()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update delivery note.', 'error' => $e->getMessage()], 500);
        }
    }
}
