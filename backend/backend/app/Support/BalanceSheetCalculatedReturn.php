<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Current-year P&L not yet closed to retained earnings — included on the balance sheet
 * so Assets = Liabilities + Equity while income/expense accounts remain open.
 */
class BalanceSheetCalculatedReturn
{
    public const DESCRIPTION = 'Net Profit / (Loss)';

    /**
     * GL account for current-year P&L (sys_prefs profitLossYear, default 9990).
     */
    public static function accountCode(): string
    {
        if (Schema::hasTable('sys_prefs')) {
            $pref = trim((string) DB::table('sys_prefs')->where('name', 'profitLossYear')->value('value'));
            if ($pref !== '') {
                return $pref;
            }
        }

        $resolved = GlAccountResolver::resolve('profitLossYear', null);

        return $resolved ?: '9990';
    }

    public static function retainedEarningsGroupName(): string
    {
        $typeId = self::retainedEarningsAccountType();
        $meta = ChartAccountMetadata::forAccountType($typeId);

        return (string) ($meta['name'] ?? 'Retained Earnings');
    }

    public static function retainedEarningsAccountType(): int
    {
        foreach (ChartAccountMetadata::typesById() as $type) {
            $name = strtoupper(html_entity_decode((string) ($type['name'] ?? ''), ENT_QUOTES | ENT_HTML5));
            if (str_contains($name, 'RETAINED')) {
                return (int) $type['id'];
            }
        }

        foreach (ChartAccountMetadata::typesById() as $type) {
            if (TrialAccountBalance::balanceSheetSection($type['id']) === 'retained_earnings') {
                return (int) $type['id'];
            }
        }

        return 7;
    }

    /**
     * @return array{opening: float, period: float, closing: float}
     */
    public static function amounts(string $fromDate, string $toDate, ?string $costCenter = null): array
    {
        if ($fromDate === '' || $toDate === '') {
            return ['opening' => 0.0, 'period' => 0.0, 'closing' => 0.0];
        }

        $fyFrom = ActiveFiscalYear::containingDate($toDate)['fiscal_year_from'];

        $opening = $fromDate < $fyFrom
            ? 0.0
            : self::netProfitForRange($fyFrom, $fromDate, $costCenter);

        $closing = $toDate < $fyFrom
            ? 0.0
            : self::netProfitForRange($fyFrom, $toDate, $costCenter);

        $period = round($closing - $opening, 2);

        return [
            'opening' => round($opening, 2),
            'period' => $period,
            'closing' => round($closing, 2),
        ];
    }

    private static function netProfitForRange(string $rangeFrom, string $rangeTo, ?string $costCenter): float
    {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasColumn('gl_trans', 'account')) {
            return 0.0;
        }

        $debitExpr = GlBalanceQuery::rangeDebitSumExpr('gt', $rangeFrom, $rangeTo);
        $creditExpr = GlBalanceQuery::rangeCreditSumExpr('gt', $rangeFrom, $rangeTo);

        $query = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        GlBalanceQuery::applyCostCenter($query, $costCenter);

        $rows = $query
            ->groupBy('cm.account_code', 'cm.account_type')
            ->selectRaw("cm.account_type, {$debitExpr} as debit, {$creditExpr} as credit")
            ->get();

        $income = 0.0;
        $costs = 0.0;

        foreach ($rows as $row) {
            $type = (int) $row->account_type;
            if (! ChartAccountMetadata::isProfitAndLossAccount($type)) {
                continue;
            }

            $signed = TrialAccountBalance::signedBalance((float) $row->debit, (float) $row->credit, $type);

            if (ChartAccountMetadata::isProfitAndLossIncomeAccount($type)) {
                $income += $signed;
            } elseif (ChartAccountMetadata::isProfitAndLossCostAccount($type)) {
                $costs += $signed;
            }
        }

        return round($income - $costs, 2);
    }
}
