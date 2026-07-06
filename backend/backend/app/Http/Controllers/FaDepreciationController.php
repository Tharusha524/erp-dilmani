<?php

namespace App\Http\Controllers;

use App\Http\Requests\FaDepreciationPreviewRequest;
use App\Http\Requests\FaDepreciationProcessRequest;
use App\Models\FaDepreciationBatch;
use App\Services\FixedAssets\FaDepreciationService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class FaDepreciationController extends Controller
{
    public function __construct(private FaDepreciationService $service)
    {
    }

    public function preview(FaDepreciationPreviewRequest $request): JsonResponse
    {
        try {
            $data = $this->service->preview($request->validated('period_date'));

            return response()->json($data);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => $e instanceof InvalidArgumentException
                    ? $e->getMessage()
                    : 'Failed to load depreciation preview.',
            ], $e instanceof InvalidArgumentException ? 422 : 500);
        }
    }

    public function process(FaDepreciationProcessRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->service->process(
                $validated['period_date'],
                $validated['reference'] ?? null,
                $validated['stock_ids'] ?? null
            );

            $status = empty($result['batch']) ? 422 : 201;

            return response()->json($result, $status);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to process depreciation. '.$e->getMessage(),
            ], 500);
        }
    }

    public function batches(): JsonResponse
    {
        try {
            $batches = FaDepreciationBatch::query()
                ->orderByDesc('period_date')
                ->limit(50)
                ->get();

            return response()->json($batches);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Failed to load depreciation batches.'], 500);
        }
    }
}
