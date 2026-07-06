<?php

namespace App\Http\Controllers;

use App\Http\Requests\DimensionRequest;
use App\Models\Dimension;
use App\Repositories\All\Dimension\DimensionInterface;
use App\Support\ActiveFiscalYear;
use App\Support\DimensionGlBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DimensionController extends Controller
{
    private DimensionInterface $dimensionRepository;

    public function __construct(DimensionInterface $dimensionRepository)
    {
        $this->dimensionRepository = $dimensionRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->dimensionRepository->all());
    }

    public function search(Request $request): JsonResponse
    {
        $filters = $request->only([
            'reference',
            'type',
            'fromDate',
            'toDate',
            'onlyOpen',
            'onlyOverdue',
            'outstandingOnly',
            'fromId',
            'toId',
            'balanceFromDate',
            'balanceToDate',
        ]);

        return response()->json($this->dimensionRepository->search($filters));
    }

    public function store(DimensionRequest $request): JsonResponse
    {
        $dimension = $this->dimensionRepository->create($request->validated());
        return response()->json($dimension, 201);
    }

    public function show(string $id): JsonResponse
    {
        $dimension = Dimension::with('tag')->find($id);
        if (!$dimension) {
            return response()->json(['message' => 'Dimension not found'], 404);
        }

        $fy = ActiveFiscalYear::range(null);
        $dimension->setAttribute(
            'balance',
            DimensionGlBalance::sum((int) $dimension->id, $fy['fiscal_year_from'], now()->toDateString())
        );

        return response()->json($dimension);
    }

    public function glBalance(Request $request, string $id): JsonResponse
    {
        $dimension = $this->dimensionRepository->find($id);
        if (!$dimension) {
            return response()->json(['message' => 'Dimension not found'], 404);
        }

        $fy = ActiveFiscalYear::range(null);
        $fromDate = $request->input('fromDate', $fy['fiscal_year_from']);
        $toDate = $request->input('toDate', now()->toDateString());

        $result = $this->dimensionRepository->glBalance((int) $id, $fromDate, $toDate);

        return response()->json([
            ...$result,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'fiscal_year_from' => $fy['fiscal_year_from'],
        ]);
    }

    public function update(DimensionRequest $request, string $id): JsonResponse
    {
        $updated = $this->dimensionRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Dimension not found'], 404);
        }

        return response()->json(['message' => 'Dimension updated successfully']);
    }

    public function destroy(string $id): JsonResponse
    {
        if ($this->dimensionRepository->hasGlTransactions((int) $id)) {
            return response()->json([
                'message' => 'Cannot delete dimension with GL transactions',
            ], 422);
        }

        $deleted = $this->dimensionRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Dimension not found'], 404);
        }

        return response()->json(['message' => 'Dimension deleted successfully']);
    }
}
