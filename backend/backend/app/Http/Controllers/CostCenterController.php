<?php

namespace App\Http\Controllers;

use App\Http\Requests\CostCenterRequest;
use App\Models\CostCenter;
use App\Repositories\All\CostCenter\CostCenterInterface;
use App\Support\ActiveFiscalYear;
use App\Support\CostCenterGlBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CostCenterController extends Controller
{
    private CostCenterInterface $costCenterRepository;

    public function __construct(CostCenterInterface $costCenterRepository)
    {
        $this->costCenterRepository = $costCenterRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->costCenterRepository->all());
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

        return response()->json($this->costCenterRepository->search($filters));
    }

    public function store(CostCenterRequest $request): JsonResponse
    {
        $costCenter = $this->costCenterRepository->create($request->validated());
        return response()->json($costCenter, 201);
    }

    public function show(string $id): JsonResponse
    {
        $costCenter = CostCenter::with('tag')->find($id);
        if (!$costCenter) {
            return response()->json(['message' => 'Cost center not found'], 404);
        }

        $fy = ActiveFiscalYear::range(null);
        $costCenter->setAttribute(
            'balance',
            CostCenterGlBalance::sum((int) $costCenter->id, $fy['fiscal_year_from'], now()->toDateString())
        );

        return response()->json($costCenter);
    }

    public function glBalance(Request $request, string $id): JsonResponse
    {
        $costCenter = $this->costCenterRepository->find($id);
        if (!$costCenter) {
            return response()->json(['message' => 'Cost center not found'], 404);
        }

        $fy = ActiveFiscalYear::range(null);
        $fromDate = $request->input('fromDate', $fy['fiscal_year_from']);
        $toDate = $request->input('toDate', now()->toDateString());

        $result = $this->costCenterRepository->glBalance((int) $id, $fromDate, $toDate);

        return response()->json([
            ...$result,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'fiscal_year_from' => $fy['fiscal_year_from'],
        ]);
    }

    public function update(CostCenterRequest $request, string $id): JsonResponse
    {
        $updated = $this->costCenterRepository->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Cost center not found'], 404);
        }

        return response()->json(['message' => 'Cost center updated successfully']);
    }

    public function destroy(string $id): JsonResponse
    {
        if ($this->costCenterRepository->hasGlTransactions((int) $id)) {
            return response()->json([
                'message' => 'Cannot delete cost center with GL transactions',
            ], 422);
        }

        $deleted = $this->costCenterRepository->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Cost center not found'], 404);
        }

        return response()->json(['message' => 'Cost center deleted successfully']);
    }
}
