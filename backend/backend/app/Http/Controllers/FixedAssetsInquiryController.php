<?php

namespace App\Http\Controllers;

use App\Repositories\All\FixedAssetsInquiry\FixedAssetsInquiryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FixedAssetsInquiryController extends Controller
{
    public function __construct(private FixedAssetsInquiryInterface $repository)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['showInactive']);

        try {
            return response()->json($this->repository->search($filters));
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to load fixed assets inquiry.',
            ], 500);
        }
    }

    public function movements(Request $request): JsonResponse
    {
        $filters = $request->only(['stockId', 'stock_id', 'location', 'fromDate', 'toDate']);

        try {
            return response()->json($this->repository->searchMovements($filters));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to load fixed asset movements.',
            ], 500);
        }
    }
}
