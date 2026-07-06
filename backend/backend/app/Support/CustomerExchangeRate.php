<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting-style customer currency exchange rate for sales documents.
 */
class CustomerExchangeRate
{
    public static function forDebtor(int $debtorNo, ?string $tranDate = null): float
    {
        if ($debtorNo <= 0) {
            return 1.0;
        }

        $customerCurrency = trim((string) (DB::table('debtors_master')
            ->where('debtor_no', $debtorNo)
            ->value('curr_code') ?? ''));

        if ($customerCurrency === '') {
            return 1.0;
        }

        $homeCurrency = self::homeCurrencyCode();
        if ($homeCurrency === '' || strtoupper($customerCurrency) === strtoupper($homeCurrency)) {
            return 1.0;
        }

        if (! Schema::hasTable('exchange_rates')) {
            return 1.0;
        }

        $date = $tranDate ?? now()->toDateString();
        $row = DB::table('exchange_rates')
            ->where('curr_code', $customerCurrency)
            ->where('date', '<=', $date)
            ->orderByDesc('date')
            ->first(['rate_sell', 'rate_buy']);

        return self::pickSalesRate($row);
    }

    /**
     * Sales documents use rate_sell; fall back to rate_buy when sell was not entered.
     */
    public static function pickSalesRate(?object $row): float
    {
        if (! $row) {
            return 1.0;
        }

        $sell = (float) ($row->rate_sell ?? 0);
        $buy = (float) ($row->rate_buy ?? 0);
        $parsed = $sell > 0.000001 ? $sell : $buy;

        return $parsed > 0.000001 ? $parsed : 1.0;
    }

    public static function rateForCurrency(string $currencyCode, ?string $tranDate = null): float
    {
        $currencyCode = trim($currencyCode);
        if ($currencyCode === '') {
            return 1.0;
        }

        $homeCurrency = self::homeCurrencyCode();
        if ($homeCurrency === '' || strtoupper($currencyCode) === strtoupper($homeCurrency)) {
            return 1.0;
        }

        if (! Schema::hasTable('exchange_rates')) {
            return 1.0;
        }

        $date = $tranDate ?? now()->toDateString();
        $row = DB::table('exchange_rates')
            ->where('curr_code', $currencyCode)
            ->where('date', '<=', $date)
            ->orderByDesc('date')
            ->first(['rate_sell', 'rate_buy']);

        return self::pickSalesRate($row);
    }

    public static function homeCurrencyCode(): string
    {
        $company = CompanySetupSettings::current();
        if (! $company?->homeCurrency) {
            return '';
        }

        return trim((string) ($company->homeCurrency->currency_abbreviation ?? ''));
    }

    public static function toHomeCurrency(float $amount, float $rate): float
    {
        if (abs($rate - 1.0) < 0.000001) {
            return round($amount, 2);
        }

        return round($amount * $rate, 2);
    }
}
