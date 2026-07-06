<?php

namespace App\Repositories\All\GlTrans;

use App\Models\GlTrans;
use App\Repositories\Base\BaseRepository;
use App\Support\GlBalanceQuery;
use App\Support\GlTransHelper;
use App\Support\TrialAccountBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GlTransRepository extends BaseRepository implements GlTransInterface
{
    public function __construct(GlTrans $model)
    {
        parent::__construct($model);
    }

    /**
     * FrontAccounting-style GL inquiry from gl_trans + chart_master + trans_types.
     *
     * @return array{rows: \Illuminate\Support\Collection, summary: array<string, mixed>|null}
     */
    public function search(array $filters): array
    {
        if (! Schema::hasTable('gl_trans')) {
            return ['rows' => collect(), 'summary' => null];
        }

        $rows = $this->buildSearchQuery($filters)
            ->orderByRaw(GlBalanceQuery::glEffectiveDateExpr('gl').' DESC')
            ->orderByDesc('gl.id')
            ->get();

        $account = trim((string) ($filters['selectedAccount'] ?? $filters['account'] ?? ''));
        $summary = ($account !== '' && $account !== 'All')
            ? $this->accountBalanceSummary(
                $account,
                (string) ($filters['fromDate'] ?? $filters['startDate'] ?? ''),
                (string) ($filters['toDate'] ?? $filters['endDate'] ?? ''),
                $filters['costCenter'] ?? null
            )
            : null;

        return [
            'rows' => $rows,
            'summary' => $summary,
        ];
    }

    /**
     * GL lines for transaction GL Postings screens (by type_no + type, then reference).
     */
    public function findForTransaction(array $filters)
    {
        if (! Schema::hasTable('gl_trans')) {
            return collect();
        }

        $module = trim((string) ($filters['module'] ?? ''));
        $orderNo = (int) ($filters['order_no'] ?? 0);
        $purchOrderNo = (int) ($filters['purch_order_no'] ?? 0);
        $reference = trim((string) ($filters['reference'] ?? ''));
        $transNo = $filters['trans_no'] ?? null;
        $transType = $filters['trans_type'] ?? null;
        $hasTransactionKey = $transNo !== null && $transNo !== '' && $transType !== null && $transType !== '';

        if ($module === 'sales' && $hasTransactionKey) {
            $typeInt = (int) $transType;
            $typeNoInt = (int) $transNo;
            $result = $this->findByTypeAndNo($typeInt, $typeNoInt);
            if ($result->isNotEmpty()) {
                return $result;
            }

            if ($reference !== '') {
                $byRef = $this->transactionGlQuery()
                    ->whereRaw('CAST(gl.type AS UNSIGNED) = ?', [$typeInt])
                    ->where('gl.reference', $reference)
                    ->orderBy('gl.id')
                    ->get();

                if ($byRef->isNotEmpty()) {
                    return $this->normalizeTransactionRows($byRef);
                }
            }

            return $result;
        }

        if ($module === 'sales' && $orderNo > 0) {
            return $this->findForSalesOrder($orderNo, $reference);
        }

        // Single purchase document (invoice, payment, GRN) — scope by type+no, not whole reference bundle.
        if ($module === 'purchases' && $hasTransactionKey) {
            $typeInt = (int) $transType;
            $typeNoInt = (int) $transNo;
            $result = $this->findByTypeAndNo($typeInt, $typeNoInt);
            if ($result->isNotEmpty()) {
                return $result;
            }

            if ($reference !== '') {
                $byRef = $this->transactionGlQuery()
                    ->whereRaw('CAST(gl.type AS UNSIGNED) = ?', [$typeInt])
                    ->where('gl.reference', $reference)
                    ->orderBy('gl.id')
                    ->get();

                if ($byRef->isNotEmpty()) {
                    return $this->normalizeTransactionRows($byRef);
                }
            }

            return $result;
        }

        // Reference-scoped purchase bundle (full document chain sharing one ref).
        if ($module === 'purchases' && $reference !== '') {
            return $this->findForPurchaseReference($reference);
        }

        if ($module === 'purchases' && ($purchOrderNo > 0 || $orderNo > 0)) {
            return $this->findForPurchaseOrder($purchOrderNo > 0 ? $purchOrderNo : $orderNo, $reference);
        }

        if ($module === 'manufacturing' && $reference !== '') {
            return $this->findForWorkOrderReference($reference);
        }

        if ($module === 'fixed_assets') {
            return $this->findForFixedAssets(
                $reference,
                (int) ($filters['trans_type'] ?? 0),
                (int) ($filters['trans_no'] ?? 0)
            );
        }

        // Legacy: order_no without module defaults to sales direct invoice bundle.
        if ($orderNo > 0 && $module === '') {
            return $this->findForSalesOrder($orderNo, $reference);
        }

        if (! $hasTransactionKey && $reference === '') {
            return collect();
        }

        if ($hasTransactionKey) {
            $typeInt = (int) $transType;
            $typeNoInt = (int) $transNo;
            $result = $this->findByTypeAndNo($typeInt, $typeNoInt);
            if ($result->isNotEmpty()) {
                return $result;
            }

            if ($reference !== '') {
                $byRef = $this->transactionGlQuery()
                    ->whereRaw('CAST(gl.type AS UNSIGNED) = ?', [$typeInt])
                    ->where('gl.reference', $reference)
                    ->orderBy('gl.id')
                    ->get();

                if ($byRef->isNotEmpty()) {
                    return $this->normalizeTransactionRows($byRef);
                }
            }

            return $result;
        }

        return $this->normalizeTransactionRows(
            $this->transactionGlQuery()
                ->where('gl.reference', $reference)
                ->orderBy('gl.id')
                ->get()
        );
    }

    /**
     * @param  list<array{0: int, 1: int}>  $keys
     */
    private function mergeGlRowsForKeys(array $keys)
    {
        if ($keys === []) {
            return collect();
        }

        $rows = collect();
        foreach ($keys as [$type, $no]) {
            $rows = $rows->merge($this->findByTypeAndNo($type, $no));
        }

        return $this->normalizeTransactionRows(
            $rows->unique(fn ($row) => (string) ($row->id ?? ''))->values()
        );
    }

    /**
     * GL lines for a sales order (invoice, delivery, customer payment / cash receipt).
     */
    private function findForSalesOrder(int $orderNo, string $reference = '')
    {
        return $this->mergeGlRowsForKeys($this->salesOrderTransactionKeys($orderNo, $reference));
    }

    /**
     * GL lines for a purchase order (supplier invoice, GRN, supplier payment).
     */
    private function findForPurchaseOrder(int $purchOrderNo, string $reference = '')
    {
        return $this->mergeGlRowsForKeys($this->purchaseOrderTransactionKeys($purchOrderNo, $reference));
    }

    /**
     * GL lines for all purchase documents sharing one exact reference.
     */
    private function findForPurchaseReference(string $reference)
    {
        $ref = trim($reference);
        if ($ref === '') {
            return collect();
        }

        return $this->mergeGlRowsForKeys($this->purchaseReferenceTransactionKeys($ref));
    }

    /**
     * GL lines for manufacturing work order issue + production (by WO reference).
     */
    private function findForWorkOrderReference(string $reference)
    {
        $ref = trim($reference);
        if ($ref === '') {
            return collect();
        }

        return $this->mergeGlRowsForKeys($this->workOrderTransactionKeys($ref));
    }

    /**
     * GL lines for fixed asset purchase, sale, disposal, and depreciation.
     */
    private function findForFixedAssets(string $reference, int $transType = 0, int $transNo = 0)
    {
        return $this->mergeGlRowsForKeys(
            $this->fixedAssetsTransactionKeys(trim($reference), $transType, $transNo)
        );
    }

    /**
     * @return list<array{0: int, 1: int}>
     */
    private function fixedAssetsTransactionKeys(string $reference, int $transType = 0, int $transNo = 0): array
    {
        $keys = [];

        if ($transType > 0 && $transNo > 0) {
            $keys["{$transType}-{$transNo}"] = [$transType, $transNo];

            // FA references reuse the same pattern across document types (e.g. 003/2026 on
            // disposal type 17 and an unrelated sales invoice type 10). When the caller
            // supplies an explicit transaction, scope GL to that document only.
            return array_values($keys);
        }

        if ($reference === '') {
            return array_values($keys);
        }

        if (Schema::hasTable('supp_trans')) {
            foreach (
                DB::table('supp_trans')
                    ->where('reference', $reference)
                    ->where('trans_type', 20)
                    ->get(['trans_type', 'trans_no']) as $row
            ) {
                $type = (int) $row->trans_type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
            }
        }

        if (Schema::hasTable('debtor_trans')) {
            foreach (
                DB::table('debtor_trans')
                    ->where('reference', $reference)
                    ->where('trans_type', 10)
                    ->get(['trans_type', 'trans_no']) as $row
            ) {
                $type = (int) $row->trans_type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
            }
        }

        if (Schema::hasTable('stock_moves')) {
            foreach (
                DB::table('stock_moves')
                    ->where('reference', $reference)
                    ->where('type', 17)
                    ->distinct()
                    ->get(['type', 'trans_no']) as $row
            ) {
                $type = (int) $row->type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
            }
        }

        if (Schema::hasTable('gl_trans') && Schema::hasColumn('gl_trans', 'type_no')) {
            foreach (
                DB::table('gl_trans')
                    ->where('type', 0)
                    ->where('reference', $reference)
                    ->whereNotNull('type_no')
                    ->distinct()
                    ->pluck('type_no') as $no
            ) {
                $journalNo = (int) $no;
                if ($journalNo > 0) {
                    $keys["0-{$journalNo}"] = [0, $journalNo];
                }
            }
        }

        return array_values($keys);
    }

    /**
     * @return list<array{0: int, 1: int}>
     */
    private function salesOrderTransactionKeys(int $orderNo, string $reference): array
    {
        $keys = [];
        $invoiceRef = $reference;

        if (Schema::hasTable('debtor_trans')) {
            $onOrder = DB::table('debtor_trans')
                ->where('order_no', $orderNo)
                ->get(['trans_type', 'trans_no', 'reference']);

            foreach ($onOrder as $row) {
                $type = (int) $row->trans_type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
                if ($type === 10 && $invoiceRef === '') {
                    $invoiceRef = trim((string) ($row->reference ?? ''));
                }
            }
        }

        if ($invoiceRef !== '') {
            if (Schema::hasTable('debtor_trans')) {
                $payments = DB::table('debtor_trans')
                    ->where('trans_type', 12)
                    ->where('reference', $invoiceRef)
                    ->get(['trans_type', 'trans_no']);

                foreach ($payments as $row) {
                    $type = (int) $row->trans_type;
                    $no = (int) $row->trans_no;
                    $keys["{$type}-{$no}"] = [$type, $no];
                }
            }

            if (Schema::hasTable('bank_trans')) {
                $banks = DB::table('bank_trans')
                    ->where('type', 12)
                    ->where('ref', $invoiceRef)
                    ->get(['type', 'trans_no']);

                foreach ($banks as $row) {
                    $type = (int) $row->type;
                    $no = (int) $row->trans_no;
                    $keys["{$type}-{$no}"] = [$type, $no];
                }
            }
        }

        return array_values($keys);
    }

    /**
     * @return list<array{0: int, 1: int}>
     */
    private function purchaseOrderTransactionKeys(int $purchOrderNo, string $reference): array
    {
        $docRef = trim($reference);

        if ($docRef !== '') {
            return $this->purchaseReferenceTransactionKeys($docRef);
        }

        $keys = [];

        if (Schema::hasTable('grn_batch')) {
            $grns = DB::table('grn_batch')
                ->where('purch_order_no', $purchOrderNo)
                ->get(['id', 'reference']);

            foreach ($grns as $row) {
                $keys['25-'.(int) $row->id] = [25, (int) $row->id];
            }
        }

        return array_values($keys);
    }

    /**
     * @return list<array{0: int, 1: int}>
     */
    private function purchaseReferenceTransactionKeys(string $reference): array
    {
        $keys = [];
        $ref = trim($reference);
        if ($ref === '') {
            return [];
        }

        if (Schema::hasTable('supp_trans')) {
            $rows = DB::table('supp_trans')
                ->where('reference', $ref)
                ->get(['trans_type', 'trans_no']);

            foreach ($rows as $row) {
                $type = (int) $row->trans_type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
            }
        }

        if (Schema::hasTable('grn_batch')) {
            $grns = DB::table('grn_batch')->where('reference', $ref)->get(['id']);
            foreach ($grns as $row) {
                $keys['25-'.(int) $row->id] = [25, (int) $row->id];
            }
        }

        if (Schema::hasTable('bank_trans')) {
            $banks = DB::table('bank_trans')
                ->where('type', 22)
                ->where('ref', $ref)
                ->get(['type', 'trans_no']);

            foreach ($banks as $row) {
                $type = (int) $row->type;
                $no = (int) $row->trans_no;
                $keys["{$type}-{$no}"] = [$type, $no];
            }
        }

        return array_values($keys);
    }

    /**
     * @return list<array{0: int, 1: int}>
     */
    private function workOrderTransactionKeys(string $reference): array
    {
        $keys = [];
        $ref = trim($reference);
        if ($ref === '') {
            return [];
        }

        if (Schema::hasTable('workorders')) {
            $wo = DB::table('workorders')->where('wo_ref', $ref)->first(['id', 'closed']);
            if ($wo) {
                $workOrderId = (int) $wo->id;
                if ((bool) ($wo->closed ?? false)) {
                    $keys["26-{$workOrderId}"] = [26, $workOrderId];
                }

                if (Schema::hasTable('wo_costing')) {
                    foreach (
                        DB::table('wo_costing')
                            ->where('workorder_id', $workOrderId)
                            ->get(['trans_type', 'trans_no']) as $row
                    ) {
                        $type = (int) ($row->trans_type ?? 0);
                        $no = (int) ($row->trans_no ?? 0);
                        if ($no > 0) {
                            $keys["{$type}-{$no}"] = [$type, $no];
                        }
                    }
                }
            }
        }

        if (Schema::hasTable('wo_issues')) {
            foreach (DB::table('wo_issues')->where('reference', $ref)->get(['issue_no']) as $row) {
                $no = (int) $row->issue_no;
                $keys["28-{$no}"] = [28, $no];
            }
        }

        if (Schema::hasTable('wo_manufacture')) {
            foreach (DB::table('wo_manufacture')->where('reference', $ref)->get(['id']) as $row) {
                $id = (int) $row->id;
                $keys["29-{$id}"] = [29, $id];
            }
        }

        return array_values($keys);
    }

    private function findByTypeAndNo(int $transType, int $transNo)
    {
        if ($transNo <= 0) {
            return collect();
        }

        $rows = $this->transactionGlQuery()
            ->whereRaw('CAST(gl.type AS UNSIGNED) = ?', [$transType]);

        if (Schema::hasColumn('gl_trans', 'type_no')) {
            $rows->where('gl.type_no', $transNo);
        } else {
            return collect();
        }

        return $this->normalizeTransactionRows($rows->orderBy('gl.id')->get());
    }

    /**
     * @return array<string, mixed>
     */
    private function accountBalanceSummary(
        string $accountCode,
        string $fromDate,
        string $toDate,
        $costCenter
    ): array {
        $accountCode = trim($accountCode);
        $accountType = (int) (DB::table('chart_master')
            ->whereRaw('TRIM(account_code) = ?', [$accountCode])
            ->value('account_type') ?? 0);

        $debitExpr = GlBalanceQuery::debitSumExpr('gt');
        $creditExpr = GlBalanceQuery::creditSumExpr('gt');

        $openingDebit = 0.0;
        $openingCredit = 0.0;
        if ($fromDate !== '') {
            $openingQuery = DB::table('gl_trans as gt')
                ->whereRaw('TRIM(gt.account) = ?', [$accountCode]);
            GlBalanceQuery::applyCostCenter($openingQuery, $costCenter, 'gt');
            GlBalanceQuery::applyGlDateOnOrBefore($openingQuery, $fromDate, 'gt');
            $openingRow = $openingQuery->selectRaw("{$debitExpr} as total_debit, {$creditExpr} as total_credit")->first();
            $openingDebit = (float) ($openingRow->total_debit ?? 0);
            $openingCredit = (float) ($openingRow->total_credit ?? 0);
        }

        $periodQuery = DB::table('gl_trans as gt')
            ->whereRaw('TRIM(gt.account) = ?', [$accountCode]);
        GlBalanceQuery::applyCostCenter($periodQuery, $costCenter, 'gt');
        if ($fromDate !== '' || $toDate !== '') {
            if ($fromDate !== '') {
                GlBalanceQuery::applyGlPeriodAfterFromThroughTo(
                    $periodQuery,
                    $fromDate,
                    $toDate !== '' ? $toDate : null,
                    'gt'
                );
            } else {
                GlBalanceQuery::applyGlDateRange($periodQuery, null, $toDate ?: null, 'gt');
            }
        }
        $periodRow = $periodQuery->selectRaw("{$debitExpr} as total_debit, {$creditExpr} as total_credit")->first();
        $periodDebit = (float) ($periodRow->total_debit ?? 0);
        $periodCredit = (float) ($periodRow->total_credit ?? 0);

        $openingSigned = TrialAccountBalance::signedBalance($openingDebit, $openingCredit, $accountType);
        $periodSigned = TrialAccountBalance::signedBalance($periodDebit, $periodCredit, $accountType);

        return [
            'account_code' => $accountCode,
            'account_type' => $accountType,
            'opening_balance' => round($openingSigned, 2),
            'period_debit' => round($periodDebit, 2),
            'period_credit' => round($periodCredit, 2),
            'period_movement' => round($periodSigned, 2),
            'closing_balance' => round($openingSigned + $periodSigned, 2),
        ];
    }

    private function buildSearchQuery(array $filters)
    {
        $dateCol = GlBalanceQuery::glEffectiveDateExpr('gl');
        $hasDebitCredit = Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit');
        $hasAmount = Schema::hasColumn('gl_trans', 'amount');

        $debitExpr = $hasDebitCredit
            ? 'COALESCE(gl.debit, 0)'
            : ($hasAmount ? 'CASE WHEN gl.amount > 0 THEN gl.amount ELSE 0 END' : '0');
        $creditExpr = $hasDebitCredit
            ? 'COALESCE(gl.credit, 0)'
            : ($hasAmount ? 'CASE WHEN gl.amount < 0 THEN ABS(gl.amount) ELSE 0 END' : '0');

        $query = DB::table('gl_trans as gl')
            ->leftJoin('chart_master as cm', function ($join) {
                $join->on(DB::raw('TRIM(gl.account)'), '=', DB::raw('TRIM(cm.account_code)'));
            })
            ->leftJoin('trans_types as tt', function ($join) {
                $join->on(DB::raw('CAST(gl.type AS UNSIGNED)'), '=', 'tt.trans_type');
            })
            ->select(
                'gl.id',
                DB::raw('CAST(gl.type AS UNSIGNED) as trans_type'),
                'gl.type_no as number',
                DB::raw('COALESCE(tt.description, CAST(gl.type AS CHAR)) as type'),
                'gl.reference',
                DB::raw("{$dateCol} as date"),
                DB::raw("CONCAT(COALESCE(cm.account_code, gl.account, ''), ' - ', COALESCE(cm.account_name, '')) as account"),
                DB::raw('COALESCE(gl.cost_center_id, "") as cost_center'),
                DB::raw("'' as personItem"),
                DB::raw("{$debitExpr} as debit"),
                DB::raw("{$creditExpr} as credit"),
                DB::raw('COALESCE(gl.memo, "") as memo')
            );

        $account = trim((string) ($filters['selectedAccount'] ?? $filters['account'] ?? ''));
        if ($account !== '' && $account !== 'All') {
            $query->whereRaw('TRIM(gl.account) = ?', [$account]);
        }

        $from = $filters['fromDate'] ?? $filters['startDate'] ?? '';
        $to = $filters['toDate'] ?? $filters['endDate'] ?? '';
        if ($from) {
            $query->whereRaw("DATE({$dateCol}) >= ?", [$from]);
        }
        if ($to) {
            $query->whereRaw("DATE({$dateCol}) <= ?", [$to]);
        }

        GlBalanceQuery::applyCostCenter($query, $filters['costCenter'] ?? null, 'gl');
        GlBalanceQuery::applyCostCenter2($query, $filters['costCenter2'] ?? null, 'gl');

        $memo = $filters['memo'] ?? '';
        if ($memo !== '' && Schema::hasColumn('gl_trans', 'memo')) {
            $query->where('gl.memo', 'like', '%'.$memo.'%');
        }

        $amountMin = $filters['amountMin'] ?? '';
        $amountMax = $filters['amountMax'] ?? '';
        if ($amountMin !== '' || $amountMax !== '') {
            $lineAmount = $hasDebitCredit
                ? '(COALESCE(gl.debit,0) + COALESCE(gl.credit,0))'
                : ($hasAmount ? 'ABS(gl.amount)' : '0');
            if ($amountMin !== '') {
                $query->whereRaw("{$lineAmount} >= ?", [(float) $amountMin]);
            }
            if ($amountMax !== '') {
                $query->whereRaw("{$lineAmount} <= ?", [(float) $amountMax]);
            }
        }

        return $query;
    }

    private function normalizeTransactionRows($rows)
    {
        return $rows->map(function ($row) {
            [$debit, $credit] = GlTransHelper::normalizeDebitCreditPair(
                (float) ($row->debit ?? 0),
                (float) ($row->credit ?? 0)
            );
            $row->debit = $debit;
            $row->credit = $credit;

            return $row;
        });
    }

    private function transactionGlQuery()
    {
        $dateCol = GlBalanceQuery::glEffectiveDateExpr('gl');
        $hasDebitCredit = Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit');
        $hasAmount = Schema::hasColumn('gl_trans', 'amount');

        $debitExpr = $hasDebitCredit
            ? 'COALESCE(gl.debit, 0)'
            : ($hasAmount ? 'CASE WHEN gl.amount > 0 THEN gl.amount ELSE 0 END' : '0');
        $creditExpr = $hasDebitCredit
            ? 'COALESCE(gl.credit, 0)'
            : ($hasAmount ? 'CASE WHEN gl.amount < 0 THEN ABS(gl.amount) ELSE 0 END' : '0');

        return DB::table('gl_trans as gl')
            ->leftJoin('chart_master as cm', function ($join) {
                $join->on(DB::raw('TRIM(gl.account)'), '=', DB::raw('TRIM(cm.account_code)'));
            })
            ->leftJoin('trans_types as tt', function ($join) {
                $join->on(DB::raw('CAST(gl.type AS UNSIGNED)'), '=', 'tt.trans_type');
            })
            ->select(
                'gl.id',
                'gl.type as trans_type',
                DB::raw(Schema::hasColumn('gl_trans', 'type_no') ? 'gl.type_no' : 'NULL as type_no'),
                DB::raw('COALESCE(tt.description, CAST(gl.type AS CHAR)) as type_label'),
                'gl.reference',
                DB::raw("{$dateCol} as date"),
                DB::raw('COALESCE(gl.account, "") as account_code'),
                DB::raw('COALESCE(cm.account_name, "") as account_name'),
                DB::raw('COALESCE(cm.account_type, 0) as account_type'),
                DB::raw("{$debitExpr} as debit"),
                DB::raw("{$creditExpr} as credit"),
                DB::raw('COALESCE(gl.memo, "") as memo')
            );
    }
}
