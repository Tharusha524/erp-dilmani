<?php

namespace App\Repositories\All\TrialBalance;

use App\Models\ChartMaster;
use App\Repositories\Base\BaseRepository;
use App\Support\GlBalanceQuery;
use App\Support\TrialAccountBalance;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TrialBalanceRepository extends BaseRepository implements TrialBalanceInterface
{
    public function __construct(ChartMaster $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): array
    {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasColumn('gl_trans', 'account')) {
            return $this->emptyResult();
        }

        $fromDate = $filters['fromDate'] ?? '';
        $toDate = $filters['toDate'] ?? '';
        $noZeroValues = array_key_exists('noZeroValues', $filters)
            ? filter_var($filters['noZeroValues'], FILTER_VALIDATE_BOOLEAN)
            : true;
        $onlyBalance = $filters['onlyBalance'] ?? false;

        $debitExpr = GlBalanceQuery::debitSumExpr('gt');
        $creditExpr = GlBalanceQuery::creditSumExpr('gt');
        $dimension = $filters['dimension'] ?? null;

        // Brought forward: GL on or before report start (includes opening journal on From date).
        $bfSub = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        if ($fromDate) {
            GlBalanceQuery::applyGlDateOnOrBefore($bfSub, $fromDate);
        }
        GlBalanceQuery::applyDimension($bfSub, $dimension);
        $bfSub = $bfSub
            ->groupBy('cm.account_code')
            ->selectRaw("cm.account_code, {$debitExpr} as bf_debit, {$creditExpr} as bf_credit");

        // This period: GL strictly after From through To (excludes opening journal on From date).
        $periodSub = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        GlBalanceQuery::applyGlPeriodAfterFromThroughTo($periodSub, $fromDate ?: null, $toDate ?: null);
        GlBalanceQuery::applyDimension($periodSub, $dimension);
        $periodSub = $periodSub
            ->groupBy('cm.account_code')
            ->selectRaw("cm.account_code, {$debitExpr} as period_debit, {$creditExpr} as period_credit");

        $rawRows = DB::table('chart_master as cm')
            ->leftJoinSub($bfSub, 'bf', 'cm.account_code', '=', 'bf.account_code')
            ->leftJoinSub($periodSub, 'period', 'cm.account_code', '=', 'period.account_code')
            ->select(
                'cm.account_code as account',
                'cm.account_name as accountName',
                'cm.account_type as accountType',
                DB::raw('COALESCE(bf.bf_debit, 0) as bf_debit'),
                DB::raw('COALESCE(bf.bf_credit, 0) as bf_credit'),
                DB::raw('COALESCE(period.period_debit, 0) as period_debit'),
                DB::raw('COALESCE(period.period_credit, 0) as period_credit')
            )
            ->orderBy('cm.account_code')
            ->get();

        $rows = $this->mapRows($rawRows, $noZeroValues, $onlyBalance);

        return [
            'rows' => $rows->values(),
            'summary' => $this->buildSummary($rows),
        ];
    }

    private function mapRows(Collection $rawRows, bool $noZeroValues, bool $onlyBalance): Collection
    {
        return $rawRows->map(function ($row) {
            $type = (int) $row->accountType;

            $bfDebit = (float) $row->bf_debit;
            $bfCredit = (float) $row->bf_credit;
            $periodDebit = (float) $row->period_debit;
            $periodCredit = (float) $row->period_credit;

            $openingSigned = TrialAccountBalance::signedBalance($bfDebit, $bfCredit, $type);
            $periodSigned = TrialAccountBalance::signedBalance($periodDebit, $periodCredit, $type);
            $closingSigned = $openingSigned + $periodSigned;

            [$bfDr, $bfCr] = TrialAccountBalance::toDebitCreditColumns($openingSigned, $type);
            [$closeDr, $closeCr] = TrialAccountBalance::toDebitCreditColumns($closingSigned, $type);

            $glOpening = $bfDebit - $bfCredit;
            $glPeriod = $periodDebit - $periodCredit;
            $glClosing = $glOpening + $glPeriod;

            return (object) [
                'account' => $row->account,
                'accountName' => $row->accountName,
                'accountType' => $type,
                'broughtForwardDebit' => $bfDr,
                'broughtForwardCredit' => $bfCr,
                'thisPeriodDebit' => round($periodDebit, 2),
                'thisPeriodCredit' => round($periodCredit, 2),
                'balanceDebit' => $closeDr,
                'balanceCredit' => $closeCr,
                'glOpening' => round($glOpening, 2),
                'glPeriod' => round($glPeriod, 2),
                'glClosing' => round($glClosing, 2),
            ];
        })->filter(function ($row) use ($noZeroValues, $onlyBalance) {
            if ($noZeroValues) {
                $activity = $row->broughtForwardDebit + $row->broughtForwardCredit
                    + $row->thisPeriodDebit + $row->thisPeriodCredit;

                if ($activity <= 0.001) {
                    return false;
                }
            }

            if ($onlyBalance) {
                if ($row->balanceDebit + $row->balanceCredit <= 0.001) {
                    return false;
                }
            }

            return true;
        });
    }

    private function buildSummary(Collection $rows): array
    {
        $tb = [
            'brought_forward_debit' => 0.0,
            'brought_forward_credit' => 0.0,
            'period_debit' => 0.0,
            'period_credit' => 0.0,
            'balance_debit' => 0.0,
            'balance_credit' => 0.0,
        ];

        $bs = [
            'opening_assets' => 0.0,
            'opening_liabilities' => 0.0,
            'opening_long_term_liabilities' => 0.0,
            'opening_current_liabilities' => 0.0,
            'opening_equity' => 0.0,
            'period_assets' => 0.0,
            'period_liabilities' => 0.0,
            'period_long_term_liabilities' => 0.0,
            'period_current_liabilities' => 0.0,
            'period_equity' => 0.0,
            'closing_assets' => 0.0,
            'closing_liabilities' => 0.0,
            'closing_long_term_liabilities' => 0.0,
            'closing_current_liabilities' => 0.0,
            'closing_equity' => 0.0,
        ];

        foreach ($rows as $row) {
            $tb['brought_forward_debit'] += $row->broughtForwardDebit;
            $tb['brought_forward_credit'] += $row->broughtForwardCredit;
            $tb['period_debit'] += $row->thisPeriodDebit;
            $tb['period_credit'] += $row->thisPeriodCredit;
            $tb['balance_debit'] += $row->balanceDebit;
            $tb['balance_credit'] += $row->balanceCredit;

            $type = (int) $row->accountType;
            if (! TrialAccountBalance::isBalanceSheetAccount($type)) {
                continue;
            }

            $opening = TrialAccountBalance::balanceSheetAmount($row->glOpening, $type);
            $period = TrialAccountBalance::balanceSheetAmount($row->glPeriod, $type);
            $closing = TrialAccountBalance::balanceSheetAmount($row->glClosing, $type);

            if (in_array($type, [1, 2, 3], true)) {
                $bs['opening_assets'] += $opening;
                $bs['period_assets'] += $period;
                $bs['closing_assets'] += $closing;
            } elseif ($type === 5) {
                $bs['opening_liabilities'] += $opening;
                $bs['opening_long_term_liabilities'] += $opening;
                $bs['period_liabilities'] += $period;
                $bs['period_long_term_liabilities'] += $period;
                $bs['closing_liabilities'] += $closing;
                $bs['closing_long_term_liabilities'] += $closing;
            } elseif ($type === 4) {
                $bs['opening_liabilities'] += $opening;
                $bs['opening_current_liabilities'] += $opening;
                $bs['period_liabilities'] += $period;
                $bs['period_current_liabilities'] += $period;
                $bs['closing_liabilities'] += $closing;
                $bs['closing_current_liabilities'] += $closing;
            } elseif (in_array($type, [6, 7], true)) {
                $bs['opening_equity'] += $opening;
                $bs['period_equity'] += $period;
                $bs['closing_equity'] += $closing;
            }
        }

        foreach ($tb as $key => $value) {
            $tb[$key] = round($value, 2);
        }

        foreach ($bs as $key => $value) {
            $bs[$key] = round($value, 2);
        }

        $bsOpening = $this->balanceSheetSlice($bs, 'opening');
        $bsPeriod = $this->balanceSheetSlice($bs, 'period');
        $bsClosing = $this->balanceSheetSlice($bs, 'closing');

        return [
            'trial_balance' => array_merge($tb, [
                'opening_balanced' => abs($tb['brought_forward_debit'] - $tb['brought_forward_credit']) < 0.01,
                'period_balanced' => abs($tb['period_debit'] - $tb['period_credit']) < 0.01,
                'closing_balanced' => abs($tb['balance_debit'] - $tb['balance_credit']) < 0.01,
            ]),
            'balance_sheet' => [
                'opening' => $bsOpening,
                'period' => $bsPeriod,
                'closing' => $bsClosing,
                'equation_balanced' => abs($bsClosing['total_assets'] - $bsClosing['liabilities_plus_equity']) < 0.01,
                'equation_difference' => round(abs($bsClosing['total_assets'] - $bsClosing['liabilities_plus_equity']), 2),
            ],
        ];
    }

    /**
     * @return array<string, float>
     */
    private function balanceSheetSlice(array $bs, string $prefix): array
    {
        $liabilities = (float) ($bs["{$prefix}_liabilities"] ?? 0);
        $equity = (float) ($bs["{$prefix}_equity"] ?? 0);

        return [
            'total_assets' => (float) ($bs["{$prefix}_assets"] ?? 0),
            'long_term_liabilities' => (float) ($bs["{$prefix}_long_term_liabilities"] ?? 0),
            'current_liabilities' => (float) ($bs["{$prefix}_current_liabilities"] ?? 0),
            'total_liabilities' => $liabilities,
            'total_equity' => $equity,
            'liabilities_plus_equity' => round($liabilities + $equity, 2),
        ];
    }

    private function emptyResult(): array
    {
        return [
            'rows' => collect(),
            'summary' => $this->buildSummary(collect()),
        ];
    }
}
