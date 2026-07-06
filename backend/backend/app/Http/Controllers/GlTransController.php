<?php

namespace App\Http\Controllers;

use App\Repositories\All\GlTrans\GlTransInterface;
use App\Services\Accounting\PostingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlTransController extends Controller
{
    private GlTransInterface $glTransRepository;

    public function __construct(GlTransInterface $glTransRepository)
    {
        $this->glTransRepository = $glTransRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([]);
    }

    /**
     * Search GL transactions with filters
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['selectedAccount', 'fromDate', 'toDate', 'dimension', 'dimension2', 'memo', 'amountMin', 'amountMax']);
        $results = $this->glTransRepository->search($filters);

        return response()->json($results);
    }

    /**
     * GL lines for a specific transaction (GL Postings views).
     */
    public function byTransaction(Request $request, PostingsService $postings): JsonResponse
    {
        $filters = $request->only([
            'trans_no',
            'trans_type',
            'reference',
            'order_no',
            'purch_order_no',
            'module',
        ]);

        // Bundle modules may return partial GL (e.g. GRN posted but supplier invoice not yet).
        $this->ensureBundleGlPosted($filters, $postings);
        $results = $this->glTransRepository->findForTransaction($filters);

        if ($results->isEmpty()) {
            try {
                $this->ensureFallbackGlPosted($filters, $postings);
                $results = $this->glTransRepository->findForTransaction($filters);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json($results);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function ensureBundleGlPosted(array $filters, PostingsService $postings): void
    {
        $module = trim((string) ($filters['module'] ?? ''));
        $reference = trim((string) ($filters['reference'] ?? ''));
        $orderNo = (int) ($filters['order_no'] ?? 0);
        $purchOrderNo = (int) ($filters['purch_order_no'] ?? 0);
        $transType = (int) ($filters['trans_type'] ?? 0);
        $transNo = (int) ($filters['trans_no'] ?? 0);

        try {
            if ($module === 'sales' && $transNo > 0 && $transType > 0) {
                $postings->ensureDebtorGlPosted(
                    $transType,
                    $transNo,
                    $reference !== '' ? $reference : null
                );
                if ($transType === 12) {
                    $postings->ensureBankGlPosted(12, $transNo, $reference !== '' ? $reference : null);
                }
            } elseif ($module === 'sales' && ($orderNo > 0 || $reference !== '')) {
                $postings->ensureSalesOrderGlPosted(
                    $orderNo,
                    $reference !== '' ? $reference : null
                );
            } elseif ($module === 'purchases' && $reference !== '') {
                $postings->ensurePurchaseGlPosted(
                    $transType > 0 ? $transType : 0,
                    $transNo > 0 ? $transNo : 0,
                    $reference
                );
            } elseif ($module === 'purchases' && ($purchOrderNo > 0 || $orderNo > 0)) {
                $postings->ensurePurchaseOrderGlPosted(
                    $purchOrderNo > 0 ? $purchOrderNo : $orderNo,
                    $reference !== '' ? $reference : null
                );
            } elseif ($module === 'manufacturing' && $reference !== '') {
                $postings->ensureWorkOrderGlPosted($reference);
            } elseif ($module === 'fixed_assets' && ($reference !== '' || ($transType > 0 && $transNo > 0))) {
                $postings->ensureFixedAssetsGlPosted(
                    $reference !== '' ? $reference : null,
                    $transType > 0 ? $transType : null,
                    $transNo > 0 ? $transNo : null
                );
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function ensureFallbackGlPosted(array $filters, PostingsService $postings): void
    {
        $module = trim((string) ($filters['module'] ?? ''));
        $orderNo = (int) ($filters['order_no'] ?? 0);
        $transType = (int) ($filters['trans_type'] ?? 0);
        $transNo = (int) ($filters['trans_no'] ?? 0);
        $reference = trim((string) ($filters['reference'] ?? ''));

        if ($orderNo > 0 && $module === '') {
            $postings->ensureSalesOrderGlPosted($orderNo, $reference !== '' ? $reference : null);

            return;
        }

        $postings->ensureModuleGlPosted(
            $transType,
            $transNo,
            $reference !== '' ? $reference : null
        );
    }

    /**
     * Backfill missing GL for historical transactions (admin maintenance).
     */
    public function backfillMissing(Request $request, PostingsService $postings): JsonResponse
    {
        $fromDate = $request->input('fromDate');
        $toDate = $request->input('toDate');

        $stats = $postings->backfillAllMissingGl(
            is_string($fromDate) && $fromDate !== '' ? $fromDate : null,
            is_string($toDate) && $toDate !== '' ? $toDate : null
        );

        return response()->json($stats);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
