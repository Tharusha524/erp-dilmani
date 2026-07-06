<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostManufacturingCostRequest;
use App\Http\Requests\PostManufacturingIssueRequest;
use App\Http\Requests\PostManufacturingProduceRequest;
use App\Http\Requests\PostManufacturingReleaseRequest;
use App\Http\Requests\PostWorkOrderEntryRequest;
use App\Services\Manufacturing\ManufacturingPostingService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class ManufacturingTransactionController extends Controller
{
    public function __construct(private ManufacturingPostingService $manufacturing) {}

    public function entry(PostWorkOrderEntryRequest $request): JsonResponse
    {
        try {
            return response()->json($this->manufacturing->createWorkOrder($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage() !== '' ? $e->getMessage() : 'Failed to create work order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function release(PostManufacturingReleaseRequest $request, string $id): JsonResponse
    {
        try {
            return response()->json($this->manufacturing->releaseWorkOrder((int) $id, $request->validated()));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to release work order.', 'error' => $e->getMessage()], 500);
        }
    }

    public function issue(PostManufacturingIssueRequest $request): JsonResponse
    {
        try {
            return response()->json($this->manufacturing->issueMaterials($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to issue materials.', 'error' => $e->getMessage()], 500);
        }
    }

    public function produce(PostManufacturingProduceRequest $request): JsonResponse
    {
        try {
            return response()->json($this->manufacturing->produce($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to produce work order.', 'error' => $e->getMessage()], 500);
        }
    }

    public function cost(PostManufacturingCostRequest $request): JsonResponse
    {
        try {
            return response()->json($this->manufacturing->postAdditionalCost($request->validated()), 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to post work order cost.', 'error' => $e->getMessage()], 500);
        }
    }
}
