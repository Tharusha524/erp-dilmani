<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting-aligned GL balance helpers (chart_master.account_code + gl_trans.account).
 */
class GlBalanceQuery
{
    public static function glDateColumn(): string
    {
        if (! Schema::hasTable('gl_trans')) {
            return 'tran_date';
        }
        if (Schema::hasColumn('gl_trans', 'tran_date')) {
            return 'tran_date';
        }

        return 'date';
    }

    /**
     * Effective GL date for filters (FrontAccounting may use tran_date and/or date).
     */
    public static function glEffectiveDateExpr(string $alias = 'gt'): string
    {
        if (! Schema::hasTable('gl_trans')) {
            return $alias.'.tran_date';
        }

        $hasTran = Schema::hasColumn('gl_trans', 'tran_date');
        $hasDate = Schema::hasColumn('gl_trans', 'date');

        if ($hasTran && $hasDate) {
            return "CASE
                WHEN {$alias}.tran_date IS NOT NULL AND DATE({$alias}.tran_date) > '1970-01-01' THEN DATE({$alias}.tran_date)
                WHEN {$alias}.date IS NOT NULL AND DATE({$alias}.date) > '1970-01-01' THEN DATE({$alias}.date)
                ELSE NULL
            END";
        }
        if ($hasTran) {
            return "DATE({$alias}.tran_date)";
        }

        return "DATE({$alias}.date)";
    }

    /** Per-row debit amount for conditional SUM(CASE...). */
    public static function debitRowExpr(string $alias = 'gt'): string
    {
        $a = $alias;
        if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
            if (Schema::hasColumn('gl_trans', 'amount')) {
                return "CASE WHEN {$a}.debit > 0 THEN {$a}.debit WHEN {$a}.amount > 0 THEN {$a}.amount ELSE 0 END";
            }

            return "COALESCE({$a}.debit, 0)";
        }
        if (Schema::hasColumn('gl_trans', 'amount')) {
            return "CASE WHEN {$a}.amount > 0 THEN {$a}.amount ELSE 0 END";
        }

        return '0';
    }

    /** Per-row credit amount for conditional SUM(CASE...). */
    public static function creditRowExpr(string $alias = 'gt'): string
    {
        $a = $alias;
        if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
            if (Schema::hasColumn('gl_trans', 'amount')) {
                return "CASE WHEN {$a}.credit > 0 THEN {$a}.credit WHEN {$a}.amount < 0 THEN ABS({$a}.amount) ELSE 0 END";
            }

            return "COALESCE({$a}.credit, 0)";
        }
        if (Schema::hasColumn('gl_trans', 'amount')) {
            return "CASE WHEN {$a}.amount < 0 THEN ABS({$a}.amount) ELSE 0 END";
        }

        return '0';
    }

    public static function openingDebitSumExpr(string $alias, ?string $fromDate): string
    {
        $debitRow = self::debitRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $fromDate) {
            return 'COALESCE(SUM('.$debitRow.'), 0)';
        }

        return "COALESCE(SUM(CASE WHEN ({$dateExpr}) IS NULL OR ({$dateExpr}) <= '{$fromDate}' THEN {$debitRow} ELSE 0 END), 0)";
    }

    public static function openingCreditSumExpr(string $alias, ?string $fromDate): string
    {
        $creditRow = self::creditRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $fromDate) {
            return 'COALESCE(SUM('.$creditRow.'), 0)';
        }

        return "COALESCE(SUM(CASE WHEN ({$dateExpr}) IS NULL OR ({$dateExpr}) <= '{$fromDate}' THEN {$creditRow} ELSE 0 END), 0)";
    }

    /** Cumulative GL through as-at date (inclusive), e.g. P&L YTD comparison. */
    public static function throughDateDebitSumExpr(string $alias, ?string $asAtDate): string
    {
        $debitRow = self::debitRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $asAtDate) {
            return 'COALESCE(SUM('.$debitRow.'), 0)';
        }

        return "COALESCE(SUM(CASE WHEN ({$dateExpr}) IS NULL OR ({$dateExpr}) <= '{$asAtDate}' THEN {$debitRow} ELSE 0 END), 0)";
    }

    public static function throughDateCreditSumExpr(string $alias, ?string $asAtDate): string
    {
        $creditRow = self::creditRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $asAtDate) {
            return 'COALESCE(SUM('.$creditRow.'), 0)';
        }

        return "COALESCE(SUM(CASE WHEN ({$dateExpr}) IS NULL OR ({$dateExpr}) <= '{$asAtDate}' THEN {$creditRow} ELSE 0 END), 0)";
    }

    public static function periodDebitSumExpr(string $alias, ?string $fromDate, ?string $toDate): string
    {
        $debitRow = self::debitRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $fromDate && ! $toDate) {
            return '0';
        }

        $when = "({$dateExpr}) IS NOT NULL";
        if ($fromDate) {
            $when .= " AND ({$dateExpr}) > '{$fromDate}'";
        }
        if ($toDate) {
            $when .= " AND ({$dateExpr}) <= '{$toDate}'";
        }

        return "COALESCE(SUM(CASE WHEN {$when} THEN {$debitRow} ELSE 0 END), 0)";
    }

    public static function periodCreditSumExpr(string $alias, ?string $fromDate, ?string $toDate): string
    {
        $creditRow = self::creditRowExpr($alias);
        $dateExpr = self::glEffectiveDateExpr($alias);

        if (! $fromDate && ! $toDate) {
            return '0';
        }

        $when = "({$dateExpr}) IS NOT NULL";
        if ($fromDate) {
            $when .= " AND ({$dateExpr}) > '{$fromDate}'";
        }
        if ($toDate) {
            $when .= " AND ({$dateExpr}) <= '{$toDate}'";
        }

        return "COALESCE(SUM(CASE WHEN {$when} THEN {$creditRow} ELSE 0 END), 0)";
    }

    /**
     * P&L / GL inquiry: inclusive date range (From through To).
     */
    public static function rangeDebitSumExpr(string $alias, ?string $fromDate, ?string $toDate): string
    {
        return self::conditionalDebitSumExpr($alias, self::inclusiveDateWhen($fromDate, $toDate, $alias));
    }

    public static function rangeCreditSumExpr(string $alias, ?string $fromDate, ?string $toDate): string
    {
        return self::conditionalCreditSumExpr($alias, self::inclusiveDateWhen($fromDate, $toDate, $alias));
    }

    private static function conditionalDebitSumExpr(string $alias, string $when): string
    {
        $debitRow = self::debitRowExpr($alias);

        return "COALESCE(SUM(CASE WHEN {$when} THEN {$debitRow} ELSE 0 END), 0)";
    }

    private static function conditionalCreditSumExpr(string $alias, string $when): string
    {
        $creditRow = self::creditRowExpr($alias);

        return "COALESCE(SUM(CASE WHEN {$when} THEN {$creditRow} ELSE 0 END), 0)";
    }

    private static function inclusiveDateWhen(?string $fromDate, ?string $toDate, string $alias): string
    {
        $dateExpr = self::glEffectiveDateExpr($alias);
        if (! $fromDate && ! $toDate) {
            return '1=1';
        }

        $when = "({$dateExpr}) IS NOT NULL";
        if ($fromDate) {
            $when .= " AND ({$dateExpr}) >= '{$fromDate}'";
        }
        if ($toDate) {
            $when .= " AND ({$dateExpr}) <= '{$toDate}'";
        }

        return $when;
    }

    public static function debitSumExpr(string $alias = 'gt'): string
    {
        $a = $alias;
        if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
            if (Schema::hasColumn('gl_trans', 'amount')) {
                return "COALESCE(SUM(CASE WHEN {$a}.debit > 0 THEN {$a}.debit WHEN {$a}.amount > 0 THEN {$a}.amount ELSE 0 END), 0)";
            }

            return "COALESCE(SUM({$a}.debit), 0)";
        }
        if (Schema::hasColumn('gl_trans', 'amount')) {
            return "COALESCE(SUM(CASE WHEN {$a}.amount > 0 THEN {$a}.amount ELSE 0 END), 0)";
        }

        return '0';
    }

    public static function creditSumExpr(string $alias = 'gt'): string
    {
        $a = $alias;
        if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
            if (Schema::hasColumn('gl_trans', 'amount')) {
                return "COALESCE(SUM(CASE WHEN {$a}.credit > 0 THEN {$a}.credit WHEN {$a}.amount < 0 THEN ABS({$a}.amount) ELSE 0 END), 0)";
            }

            return "COALESCE(SUM({$a}.credit), 0)";
        }
        if (Schema::hasColumn('gl_trans', 'amount')) {
            return "COALESCE(SUM(CASE WHEN {$a}.amount < 0 THEN ABS({$a}.amount) ELSE 0 END), 0)";
        }

        return '0';
    }

    public static function signedSumExpr(string $alias = 'gt'): string
    {
        $a = $alias;
        if (Schema::hasColumn('gl_trans', 'debit') && Schema::hasColumn('gl_trans', 'credit')) {
            return "COALESCE(SUM({$a}.debit - {$a}.credit), 0)";
        }
        if (Schema::hasColumn('gl_trans', 'amount')) {
            return "COALESCE(SUM({$a}.amount), 0)";
        }

        return '0';
    }

    public static function joinGlToChart(Builder $query, string $chartAlias = 'cm', string $glAlias = 'gt'): Builder
    {
        return $query->leftJoin('gl_trans as '.$glAlias, $chartAlias.'.account_code', '=', $glAlias.'.account');
    }

    public static function applyGlDateBefore(Builder $query, string $beforeDate, string $glAlias = 'gt'): Builder
    {
        $col = self::glEffectiveDateExpr($glAlias);

        return $query->whereRaw("DATE({$col}) < ?", [$beforeDate]);
    }

    public static function applyGlDateAfter(Builder $query, string $afterDate, string $glAlias = 'gt'): Builder
    {
        $col = self::glEffectiveDateExpr($glAlias);

        return $query->whereRaw("DATE({$col}) > ?", [$afterDate]);
    }

    public static function applyGlDateRange(Builder $query, ?string $from, ?string $to, string $glAlias = 'gt'): Builder
    {
        $col = self::glEffectiveDateExpr($glAlias);
        if ($from) {
            $query->whereRaw("DATE({$col}) >= ?", [$from]);
        }
        if ($to) {
            $query->whereRaw("DATE({$col}) <= ?", [$to]);
        }

        return $query;
    }

    /**
     * Opening / brought-forward: GL on or before report start (includes opening journal on From date).
     */
    public static function applyGlDateOnOrBefore(Builder $query, ?string $asAt, string $glAlias = 'gt'): Builder
    {
        if (! $asAt) {
            return $query;
        }
        $col = self::glEffectiveDateExpr($glAlias);

        return $query->whereRaw("DATE({$col}) <= ?", [$asAt]);
    }

    /**
     * Period movements: GL strictly after From through To (opening journal on From stays in Opening only).
     */
    public static function applyGlPeriodAfterFromThroughTo(
        Builder $query,
        ?string $fromDate,
        ?string $toDate,
        string $glAlias = 'gt'
    ): Builder {
        $col = self::glEffectiveDateExpr($glAlias);
        if ($fromDate) {
            $query->whereRaw("DATE({$col}) > ?", [$fromDate]);
        }
        if ($toDate) {
            $query->whereRaw("DATE({$col}) <= ?", [$toDate]);
        }

        return $query;
    }

    public static function applyDimension(Builder $query, $dimension, string $glAlias = 'gt'): Builder
    {
        if ($dimension === null || $dimension === '' || ! Schema::hasTable('gl_trans')) {
            return $query;
        }

        $col = Schema::hasColumn('gl_trans', 'dimension_id')
            ? $glAlias.'.dimension_id'
            : (Schema::hasColumn('gl_trans', 'dimension') ? $glAlias.'.dimension' : null);

        if ($col === null) {
            return $query;
        }

        return $query->where($col, $dimension);
    }

    public static function applyDimension2(Builder $query, $dimension2, string $glAlias = 'gt'): Builder
    {
        if ($dimension2 === null || $dimension2 === '' || ! Schema::hasColumn('gl_trans', 'dimension2_id')) {
            return $query;
        }

        return $query->where($glAlias.'.dimension2_id', $dimension2);
    }
}
