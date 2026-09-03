<?php

namespace App\Repositories\All\ProfitAndLoss;

use App\Models\ChartMaster;
use App\Repositories\Base\BaseRepository;
use App\Support\ActiveFiscalYear;
use App\Support\GlBalanceQuery;
use App\Support\TrialAccountBalance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProfitAndLossRepository extends BaseRepository implements ProfitAndLossInterface
{
    public function __construct(ChartMaster $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): Collection
    {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasColumn('gl_trans', 'account')) {
            return collect();
        }

        $fromDate = (string) ($filters['fromDate'] ?? '');
        $toDate = (string) ($filters['toDate'] ?? '');
        $compareTo = (string) ($filters['compareTo'] ?? 'Accumulated');

        if ($fromDate === '' || $toDate === '') {
            return collect();
        }

        $costCenter = $filters['costCenter'] ?? null;
        $periodDebitExpr = GlBalanceQuery::rangeDebitSumExpr('gt', $fromDate, $toDate);
        $periodCreditExpr = GlBalanceQuery::rangeCreditSumExpr('gt', $fromDate, $toDate);

        $periodSub = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        GlBalanceQuery::applyCostCenter($periodSub, $costCenter);
        $periodSub = $periodSub
            ->groupBy('cm.account_code')
            ->selectRaw(
                "cm.account_code,
                {$periodDebitExpr} as period_debit,
                {$periodCreditExpr} as period_credit"
            );

        $compareSub = $this->buildComparisonSubquery($compareTo, $fromDate, $toDate, $costCenter);

        $hasChartTypes = Schema::hasTable('chart_types');
        $query = DB::table('chart_master as cm')
            ->leftJoinSub($periodSub, 'period', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(period.account_code)'));
            })
            ->leftJoinSub($compareSub, 'compare', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(compare.account_code)'));
            });

        if ($hasChartTypes) {
            $query->leftJoin('chart_types as ct', 'cm.account_type', '=', 'ct.id');
        }
        if ($hasChartTypes && Schema::hasTable('chart_class')) {
            $query->leftJoin('chart_class as cc', 'ct.class_id', '=', 'cc.cid');
        }

        $rawRows = $query
            ->select(
                'cm.account_code',
                'cm.account_name as groupAccountName',
                'cm.account_type as account_type',
                $hasChartTypes ? 'ct.name as type' : DB::raw("'' as type"),
                $hasChartTypes ? 'ct.name as typeName' : DB::raw("'' as typeName"),
                $hasChartTypes ? 'ct.class_id as classId' : DB::raw("'' as classId"),
                ($hasChartTypes && Schema::hasTable('chart_class')) ? 'cc.class_name as className' : DB::raw("'' as className"),
                DB::raw('COALESCE(period.period_debit, 0) as period_debit'),
                DB::raw('COALESCE(period.period_credit, 0) as period_credit'),
                DB::raw('COALESCE(compare.compare_debit, 0) as compare_debit'),
                DB::raw('COALESCE(compare.compare_credit, 0) as compare_credit')
            )
            ->orderBy('classId')
            ->orderBy('account_type')
            ->orderBy('cm.account_code')
            ->get();

        $rows = $rawRows
            ->map(function ($row) {
                $type = (int) $row->account_type;
                if (! TrialAccountBalance::isProfitAndLossAccount($type)) {
                    return null;
                }

                $periodSigned = TrialAccountBalance::signedBalance(
                    (float) $row->period_debit,
                    (float) $row->period_credit,
                    $type
                );
                $compareSigned = TrialAccountBalance::signedBalance(
                    (float) $row->compare_debit,
                    (float) $row->compare_credit,
                    $type
                );

                if (abs($periodSigned) + abs($compareSigned) < 0.001) {
                    return null;
                }

                $achieve = abs($compareSigned) < 0.001
                    ? '999.0'
                    : number_format(($periodSigned / $compareSigned) * 100, 1, '.', '');

                return (object) [
                    'account_code' => trim((string) $row->account_code),
                    'groupAccountName' => (string) $row->groupAccountName,
                    'account_type' => $type,
                    'type' => (string) ($row->type ?? ''),
                    'typeName' => (string) ($row->typeName ?? ''),
                    'classId' => trim((string) ($row->classId ?? '')),
                    'className' => (string) ($row->className ?? ''),
                    'period' => round($periodSigned, 2),
                    'compareValue' => round($compareSigned, 2),
                    'achievePercent' => $achieve,
                ];
            })
            ->filter()
            ->values();

        // Internal Service Invoice (Embroidery/Printing) is deliberately isolated
        // from gl_trans — merge its Income/Factory-Expense pair in, computed
        // fresh here on every request, never written to the ledger. Which
        // lines show depends on the cost center filter (see method below).
        $rows = $rows->concat($this->internalServiceInvoicePnlRows($fromDate, $toDate, $compareTo, $costCenter));

        return $rows;
    }

    /**
     * Embroidery/Sticker Printing income and its mirrored Factory expense,
     * sourced from internal_service_invoices (identified by their existing
     * Cost Center selection) — same amount posted as income for that
     * category and as a Factory expense, per the 1:1 internal-transfer rule.
     *
     * Cost center filter behaviour:
     *  - No filter ("Entire"): both the income and the mirrored expense show.
     *  - Filtered by Embroidery/Printing: only that category's income shows
     *    (the expense belongs to Factory, not to the category itself).
     *  - Filtered by Factory: only the mirrored expense lines show.
     *  - Any other cost center: nothing (unrelated to Internal Service Invoice).
     *
     * @return Collection<int, object>
     */
    private function internalServiceInvoicePnlRows(
        string $fromDate,
        string $toDate,
        string $compareTo,
        ?string $costCenter = null
    ): Collection {
        if (! Schema::hasTable('internal_service_invoices') || ! Schema::hasTable('cost_centers')) {
            return collect();
        }

        $costCenterRows = DB::table('cost_centers')
            ->whereIn(DB::raw('LOWER(name)'), ['embroidery', 'sticker printing', 'printing', 'factory'])
            ->get(['id', 'name']);

        $categories = $costCenterRows
            ->reject(fn ($cc) => strtolower($cc->name) === 'factory')
            ->mapWithKeys(fn ($cc) => [
                (int) $cc->id => str_contains(strtolower($cc->name), 'print') ? 'Printing' : 'Embroidery',
            ]);
        $factoryId = optional($costCenterRows->first(fn ($cc) => strtolower($cc->name) === 'factory'))->id;
        $factoryId = $factoryId !== null ? (int) $factoryId : null;

        if ($categories->isEmpty()) {
            return collect();
        }

        // Decide which side(s) to include based on the selected cost center.
        $showIncomeForCostCenter = null; // null = show income for every category
        $showExpense = true;
        if ($costCenter !== null && $costCenter !== '') {
            $selected = (int) $costCenter;
            if ($factoryId !== null && $selected === $factoryId) {
                $showIncomeForCostCenter = -1; // no category matches -> no income rows
                $showExpense = true;
            } elseif ($categories->has($selected)) {
                $showIncomeForCostCenter = $selected;
                $showExpense = false;
            } else {
                // Unrelated cost center selected — nothing to add.
                return collect();
            }
        }

        [$compareFromDate, $compareToDate] = $this->internalServiceInvoiceCompareRange($compareTo, $fromDate, $toDate);

        $sumFor = function (string $from, ?string $to) use ($categories) {
            if ($to === null) {
                return [];
            }

            return DB::table('internal_service_invoices')
                ->whereIn('cost_center_id', $categories->keys())
                ->whereDate('tran_date', '>=', $from)
                ->whereDate('tran_date', '<=', $to)
                ->groupBy('cost_center_id')
                ->selectRaw('cost_center_id, SUM(advance_amount + balance_due) as total')
                ->pluck('total', 'cost_center_id')
                ->all();
        };

        $periodTotals = $sumFor($fromDate, $toDate);
        $compareTotals = $sumFor($compareFromDate ?? $fromDate, $compareToDate);

        $achieve = function (float $period, float $compare): string {
            if (abs($compare) < 0.001) {
                return '999.0';
            }

            return number_format(($period / $compare) * 100, 1, '.', '');
        };

        $rows = collect();
        foreach ($categories as $costCenterId => $categoryName) {
            $period = round((float) ($periodTotals[$costCenterId] ?? 0), 2);
            $compare = round((float) ($compareTotals[$costCenterId] ?? 0), 2);
            if (abs($period) + abs($compare) < 0.001) {
                continue;
            }

            $includeIncome = $showIncomeForCostCenter === null || $showIncomeForCostCenter === $costCenterId;
            if ($includeIncome) {
                $rows->push((object) [
                    'account_code' => 'ISI-'.strtoupper($categoryName).'-INC',
                    'groupAccountName' => $categoryName.' Income',
                    'account_type' => 9,
                    'type' => $categoryName.' Income',
                    'typeName' => $categoryName.' Income',
                    'classId' => '3',
                    'className' => 'Income',
                    'period' => $period,
                    'compareValue' => $compare,
                    'achievePercent' => $achieve($period, $compare),
                ]);
            }

            // Same amount mirrored as a Factory expense (internal transfer).
            if ($showExpense) {
                $rows->push((object) [
                    'account_code' => 'ISI-'.strtoupper($categoryName).'-EXP',
                    'groupAccountName' => $categoryName,
                    'account_type' => 10,
                    'type' => 'Factory Expense',
                    'typeName' => 'Factory Expense',
                    'classId' => '5',
                    'className' => 'Costs',
                    'period' => $period,
                    'compareValue' => $compare,
                    'achievePercent' => $achieve($period, $compare),
                ]);
            }
        }

        return $rows;
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function internalServiceInvoiceCompareRange(string $compareTo, string $fromDate, string $toDate): array
    {
        if ($compareTo === 'Period Y-1') {
            return [
                date('Y-m-d', strtotime($fromDate.' -1 year')),
                date('Y-m-d', strtotime($toDate.' -1 year')),
            ];
        }

        if ($compareTo === 'Accumulated') {
            $fyStart = ActiveFiscalYear::containingDate($fromDate)['fiscal_year_from'];
            if ($fromDate <= $fyStart) {
                return [null, null];
            }

            return [$fyStart, Carbon::parse($fromDate)->subDay()->toDateString()];
        }

        return [null, null];
    }

    private function buildComparisonSubquery(string $compareTo, string $fromDate, string $toDate, ?string $costCenter = null)
    {
        if ($compareTo === 'Period Y-1') {
            $fromDateYear = date('Y-m-d', strtotime($fromDate.' -1 year'));
            $toDateYear = date('Y-m-d', strtotime($toDate.' -1 year'));
            $debitExpr = GlBalanceQuery::rangeDebitSumExpr('gt', $fromDateYear, $toDateYear);
            $creditExpr = GlBalanceQuery::rangeCreditSumExpr('gt', $fromDateYear, $toDateYear);
        } elseif ($compareTo === 'Accumulated') {
            $fyStart = ActiveFiscalYear::containingDate($fromDate)['fiscal_year_from'];
            if ($fromDate <= $fyStart) {
                return $this->zeroCompareSubquery();
            }
            $accumTo = Carbon::parse($fromDate)->subDay()->toDateString();
            $debitExpr = GlBalanceQuery::rangeDebitSumExpr('gt', $fyStart, $accumTo);
            $creditExpr = GlBalanceQuery::rangeCreditSumExpr('gt', $fyStart, $accumTo);
        } else {
            return $this->zeroCompareSubquery();
        }

        $q = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        GlBalanceQuery::applyCostCenter($q, $costCenter);

        return $q->groupBy('cm.account_code')->selectRaw(
            "cm.account_code, {$debitExpr} as compare_debit, {$creditExpr} as compare_credit"
        );
    }

    private function zeroCompareSubquery()
    {
        return DB::table('chart_master')
            ->selectRaw('account_code, 0 as compare_debit, 0 as compare_credit')
            ->groupBy('account_code');
    }
}
