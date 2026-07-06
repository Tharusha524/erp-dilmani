<?php

namespace App\Http\Controllers;

use App\Repositories\All\ProfitAndLoss\ProfitAndLossInterface;
use App\Services\Accounting\ReportGlSyncService;
use App\Support\ProfitAndLossStatementBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfitAndLossController extends Controller
{
    public function __construct(
        private ProfitAndLossInterface $profitAndLossRepository,
        private ReportGlSyncService $reportGlSync
    ) {
    }

    /**
     * Search profit and loss data. Syncs missing GL for the date range first (syncGl=true by default).
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['fromDate', 'toDate', 'compareTo', 'costCenter']);
            $syncGl = filter_var($request->input('syncGl', true), FILTER_VALIDATE_BOOLEAN);

            $glSync = $this->reportGlSync->syncBeforeReport($filters, $syncGl);
            $rows = $this->profitAndLossRepository->search($filters);

            $payload = [
                'rows' => $rows->values(),
                'statement' => (new ProfitAndLossStatementBuilder)->build(
                    $rows,
                    (string) ($filters['fromDate'] ?? ''),
                    (string) ($filters['toDate'] ?? ''),
                    (string) ($filters['compareTo'] ?? 'Accumulated'),
                    $filters['costCenter'] ?? null
                ),
            ];

            if ($glSync !== null) {
                $payload['glSync'] = $glSync;
            }

            return response()->json($payload);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to load profit and loss data: '.$e->getMessage(),
            ], 500);
        }
    }
}
