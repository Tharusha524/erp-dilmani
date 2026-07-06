<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostGrnDirectRequest;
use App\Http\Requests\PostGrnReceiveRequest;
use App\Services\Purchasing\GrnReceiptService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class PurchGrnController extends Controller
{
    public function __construct(private GrnReceiptService $grn) {}

    public function receiveFromPo(PostGrnReceiveRequest $request): JsonResponse
    {
        try {
            return response()->json($this->grn->receiveFromPurchaseOrder($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to receive purchase order.', 'error' => $e->getMessage()], 500);
        }
    }

    public function directGrn(PostGrnDirectRequest $request): JsonResponse
    {
        try {
            return response()->json($this->grn->directGrn($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post direct GRN.', 'error' => $e->getMessage()], 500);
        }
    }

    public function void(int $batchId): JsonResponse
    {
        try {
            return response()->json($this->grn->void($batchId, request()->input('memo')));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to void GRN.', 'error' => $e->getMessage()], 500);
        }
    }
}
