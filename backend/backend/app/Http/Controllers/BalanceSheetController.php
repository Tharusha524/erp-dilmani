<?php

namespace App\Http\Controllers;

use App\Repositories\All\BalanceSheet\BalanceSheetInterface;
use App\Services\Accounting\ReportGlSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceSheetController extends Controller
{
    public function __construct(
        private BalanceSheetInterface $balanceSheetRepository,
        private ReportGlSyncService $reportGlSync
    ) {
    }

    /**
     * Search balance sheet data. Syncs missing GL for the date range first (syncGl=true by default).
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['asAtDate', 'fromDate', 'toDate', 'dimension', 'noZeroValues']);
            $syncGl = filter_var($request->input('syncGl', true), FILTER_VALIDATE_BOOLEAN);

            $glSync = $this->reportGlSync->syncBeforeReport($filters, $syncGl);
            $results = $this->balanceSheetRepository->search($filters);

            if ($glSync !== null) {
                $results['glSync'] = $glSync;
            }

            return response()->json($results);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to load balance sheet data: '.$e->getMessage(),
            ], 500);
        }
    }
}
