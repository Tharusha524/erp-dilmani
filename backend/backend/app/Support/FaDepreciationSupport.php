<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Fixed asset depreciation helpers — straight line: (Cost − Salvage) ÷ Useful Life. */
class FaDepreciationSupport
{
    /**
     * Resolve stored depreciation_method to FrontAccounting code (S, D, N, O).
     */
    public static function resolveMethodCode(mixed $stored): string
    {
        $raw = trim((string) ($stored ?? ''));
        if ($raw === '') {
            return 'S';
        }

        if (strlen($raw) === 1 && ctype_alpha($raw)) {
            return strtoupper($raw);
        }

        if (Schema::hasTable('depreciation_method')) {
            $row = DB::table('depreciation_method')->where('id', (int) $raw)->first(['type']);
            if ($row && trim((string) ($row->type ?? '')) !== '') {
                return strtoupper((string) $row->type);
            }
        }

        return 'S';
    }

    public static function depreciableAmount(float $cost, float $salvage): float
    {
        return max(0, round($cost - max(0, $salvage), 2));
    }

    public static function remainingDepreciable(float $cost, float $salvage, float $accumulated): float
    {
        return max(0, round(self::depreciableAmount($cost, $salvage) - max(0, $accumulated), 2));
    }

    /** Annual straight-line depreciation. */
    public static function straightLineAnnual(float $cost, float $salvage, int $usefulLifeYears): float
    {
        if ($usefulLifeYears <= 0) {
            return 0;
        }

        return round(self::depreciableAmount($cost, $salvage) / $usefulLifeYears, 2);
    }

    /** Per-period straight-line amount (monthly or yearly). */
    public static function straightLinePeriod(float $cost, float $salvage, int $usefulLifeYears, int $periodsPerYear): float
    {
        if ($usefulLifeYears <= 0 || $periodsPerYear <= 0) {
            return 0;
        }

        return round(self::straightLineAnnual($cost, $salvage, $usefulLifeYears) / $periodsPerYear, 2);
    }

    /** Derive annual % rate from cost, salvage, and useful life (legacy field compatibility). */
    public static function annualRateFromLife(float $cost, float $salvage, int $usefulLifeYears): float
    {
        if ($cost <= 0.001 || $usefulLifeYears <= 0) {
            return 0;
        }

        return round((self::depreciableAmount($cost, $salvage) / $cost) * 100 / $usefulLifeYears, 4);
    }
}
