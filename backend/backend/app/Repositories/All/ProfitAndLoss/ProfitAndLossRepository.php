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

        return $rawRows
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
