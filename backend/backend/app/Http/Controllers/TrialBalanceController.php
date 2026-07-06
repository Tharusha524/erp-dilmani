<?php

namespace App\Http\Controllers;

use App\Repositories\All\TrialBalance\TrialBalanceInterface;
use App\Services\Accounting\ReportGlSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrialBalanceController extends Controller
{
    public function __construct(
        private TrialBalanceInterface $trialBalanceRepository,
        private ReportGlSyncService $reportGlSync
    ) {
    }

    /**
     * Search trial balance by filters. Syncs missing GL for the date range first (syncGl=true by default).
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['fromDate', 'toDate', 'dimension', 'noZeroValues', 'onlyBalance', 'groupTotalsOnly']);
        $syncGl = filter_var($request->input('syncGl', true), FILTER_VALIDATE_BOOLEAN);

        $glSync = $this->reportGlSync->syncBeforeReport($filters, $syncGl);
        $results = $this->trialBalanceRepository->search($filters);

        if ($glSync !== null) {
            $results['glSync'] = $glSync;
        }

        return response()->json($results);
    }
}
