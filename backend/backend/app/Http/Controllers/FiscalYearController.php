<?php

namespace App\Http\Controllers;

use App\Http\Requests\FiscalYearRequest;
use App\Repositories\All\FiscalYear\FiscalYearInterface;

class FiscalYearController extends Controller
{
    private FiscalYearInterface $fiscalYearRepo;

    public function __construct(FiscalYearInterface $fiscalYearRepo)
    {
        $this->fiscalYearRepo = $fiscalYearRepo;
    }

    public function index()
    {
        return response()->json($this->fiscalYearRepo->all());
    }

    public function active()
    {
        $range = \App\Support\ActiveFiscalYear::range();
        $year = \App\Support\ActiveFiscalYear::current();

        return response()->json([
            'id' => $range['id'],
            'fiscal_year_from' => $range['fiscal_year_from'],
            'fiscal_year_to' => $range['fiscal_year_to'],
            'report_start' => $range['report_start'],
            'report_end' => $range['report_end'],
            'label' => $range['label'],
            'reference_suffix' => \App\Support\ActiveFiscalYear::referenceSuffix(
                $range['fiscal_year_from'],
                $range['fiscal_year_to']
            ),
            'closed' => (bool) ($year?->closed ?? false),
        ]);
    }

    public function nextReference(\Illuminate\Http\Request $request, \App\Services\FiscalYear\TransactionReferenceService $service)
    {
        $validated = $request->validate([
            'trans_type' => 'required|integer|min:0',
            'asOfDate' => 'nullable|date',
        ]);

        try {
            return response()->json(
                $service->next((int) $validated['trans_type'], $validated['asOfDate'] ?? null)
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to generate reference number: '.$e->getMessage(),
            ], 500);
        }
    }

    public function store(FiscalYearRequest $request)
    {
        $fiscalYear = $this->fiscalYearRepo->create($request->validated());
        return response()->json($fiscalYear, 201);
    }

    public function show(string $id)
    {
        $fiscalYear = $this->fiscalYearRepo->find($id);
        if (!$fiscalYear) {
            return response()->json(['message' => 'Fiscal year not found'], 404);
        }
        return response()->json($fiscalYear);
    }

    public function update(FiscalYearRequest $request, string $id)
    {
        $fiscalYear = $this->fiscalYearRepo->find($id);
        if (!$fiscalYear) {
            return response()->json(['message' => 'Fiscal year not found'], 404);
        }

        $fiscalYear = $this->fiscalYearRepo->update($id, $request->validated());
        return response()->json($fiscalYear);
    }

    public function destroy(string $id)
    {
        $fiscalYear = $this->fiscalYearRepo->find($id);
        if (!$fiscalYear) {
            return response()->json(['message' => 'Fiscal year not found'], 404);
        }

        $this->fiscalYearRepo->delete($id);
        return response()->json(['message' => 'Fiscal year deleted']);
    }

    public function rollover(\Illuminate\Http\Request $request, \App\Services\FiscalYear\FiscalYearRolloverService $service)
    {
        try {
            $asOf = $request->input('asOfDate');
            $results = $service->processDueRollovers(is_string($asOf) && $asOf !== '' ? $asOf : null);

            return response()->json([
                'processed' => count($results),
                'results' => $results,
                'message' => count($results) > 0
                    ? 'Fiscal year rollover completed.'
                    : 'No fiscal years were due for rollover.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Fiscal year rollover failed: '.$e->getMessage(),
            ], 500);
        }
    }

    public function rolloverOne(string $id, \App\Services\FiscalYear\FiscalYearRolloverService $service)
    {
        $fiscalYear = $this->fiscalYearRepo->find($id);
        if (! $fiscalYear) {
            return response()->json(['message' => 'Fiscal year not found'], 404);
        }

        try {
            $result = $service->rolloverYear($fiscalYear, (bool) request()->boolean('force'));

            return response()->json($result);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Fiscal year rollover failed: '.$e->getMessage(),
            ], 500);
        }
    }
}
