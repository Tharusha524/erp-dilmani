<?php

namespace App\Support;

use App\Models\CompanySetup;
use App\Models\FiscalYear;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class ActiveFiscalYear
{
    /**
     * Resolve the active fiscal year for the company (or any open year that includes today).
     */
    public static function current(?string $asOfDate = null): ?FiscalYear
    {
        if (! Schema::hasTable('fiscal_years')) {
            return null;
        }

        $asOf = Carbon::parse($asOfDate ?? now()->toDateString())->startOfDay();

        if (Schema::hasTable('company_setup')) {
            $company = CompanySetup::query()->with('fiscalYear')->first();
            $configured = $company?->fiscalYear;
            if ($configured && self::includesDate($configured, $asOf) && ! $configured->closed) {
                return $configured;
            }
        }

        $openIncludingToday = FiscalYear::query()
            ->where('closed', false)
            ->whereDate('fiscal_year_from', '<=', $asOf)
            ->whereDate('fiscal_year_to', '>=', $asOf)
            ->orderByDesc('fiscal_year_from')
            ->first();

        if ($openIncludingToday) {
            return $openIncludingToday;
        }

        return FiscalYear::query()
            ->where('closed', false)
            ->orderByDesc('fiscal_year_from')
            ->first();
    }

    /**
     * @return array{
     *     id: int|null,
     *     fiscal_year_from: string,
     *     fiscal_year_to: string,
     *     report_start: string,
     *     report_end: string,
     *     label: string
     * }
     */
    public static function range(?string $asOfDate = null): array
    {
        $asOf = Carbon::parse($asOfDate ?? now()->toDateString())->startOfDay();
        $year = self::current($asOf->toDateString());

        if (! $year) {
            $from = $asOf->copy()->startOfYear()->toDateString();
            $to = $asOf->toDateString();

            return [
                'id' => null,
                'fiscal_year_from' => $from,
                'fiscal_year_to' => $to,
                'report_start' => $from,
                'report_end' => $to,
                'label' => 'Calendar year '.$asOf->year,
            ];
        }

        $from = Carbon::parse($year->fiscal_year_from)->toDateString();
        $to = Carbon::parse($year->fiscal_year_to)->toDateString();
        $reportEnd = $asOf->toDateString();
        if ($asOf->gt(Carbon::parse($to))) {
            $reportEnd = $to;
        } elseif ($asOf->lt(Carbon::parse($from))) {
            $reportEnd = $from;
        }

        return [
            'id' => (int) $year->id,
            'fiscal_year_from' => $from,
            'fiscal_year_to' => $to,
            'report_start' => $from,
            'report_end' => $reportEnd,
            'label' => self::label($from, $to),
        ];
    }

    public static function defaultStart(?string $asOfDate = null): string
    {
        return self::range($asOfDate)['report_start'];
    }

    public static function defaultEnd(?string $asOfDate = null): string
    {
        return self::range($asOfDate)['report_end'];
    }

    /**
     * Fiscal year that contains the given date (open or closed).
     *
     * @return array{fiscal_year_from: string, fiscal_year_to: string}
     */
    public static function containingDate(string $date): array
    {
        $asOf = Carbon::parse($date)->startOfDay();

        if (Schema::hasTable('fiscal_years')) {
            $year = FiscalYear::query()
                ->whereDate('fiscal_year_from', '<=', $asOf)
                ->whereDate('fiscal_year_to', '>=', $asOf)
                ->orderByDesc('fiscal_year_from')
                ->first();

            if ($year) {
                return [
                    'fiscal_year_from' => Carbon::parse($year->fiscal_year_from)->toDateString(),
                    'fiscal_year_to' => Carbon::parse($year->fiscal_year_to)->toDateString(),
                ];
            }
        }

        return [
            'fiscal_year_from' => $asOf->copy()->startOfYear()->toDateString(),
            'fiscal_year_to' => $asOf->copy()->endOfYear()->toDateString(),
        ];
    }

    /**
     * Year suffix used in document references (e.g. 001/2025 or 001/2025-2026).
     */
    public static function referenceSuffix(?string $from = null, ?string $to = null, ?FiscalYear $year = null): string
    {
        if ($year) {
            $from = Carbon::parse($year->fiscal_year_from)->toDateString();
            $to = Carbon::parse($year->fiscal_year_to)->toDateString();
        }

        if (! $from || ! $to) {
            $range = self::range();

            return self::referenceSuffix($range['fiscal_year_from'], $range['fiscal_year_to']);
        }

        $fromYear = Carbon::parse($from)->year;
        $toYear = Carbon::parse($to)->year;

        return $fromYear === $toYear ? (string) $fromYear : "{$fromYear}-{$toYear}";
    }

    private static function includesDate(FiscalYear $year, Carbon $asOf): bool
    {
        return $asOf->betweenIncluded(
            Carbon::parse($year->fiscal_year_from)->startOfDay(),
            Carbon::parse($year->fiscal_year_to)->endOfDay()
        );
    }

    private static function label(string $from, string $to): string
    {
        $fromDate = Carbon::parse($from);
        $toDate = Carbon::parse($to);

        if ($fromDate->year === $toDate->year) {
            return 'FY '.$fromDate->year;
        }

        return 'FY '.$fromDate->format('M Y').' – '.$toDate->format('M Y');
    }
}
