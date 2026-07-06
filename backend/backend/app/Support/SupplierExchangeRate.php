<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting-style supplier currency exchange rate for purchasing documents.
 */
class SupplierExchangeRate
{
    public static function forSupplier(int $supplierId, ?string $tranDate = null): float
    {
        if ($supplierId <= 0) {
            return 1.0;
        }

        $supplierCurrency = trim((string) (DB::table('suppliers')
            ->where('supplier_id', $supplierId)
            ->value('curr_code') ?? ''));

        if ($supplierCurrency === '') {
            return 1.0;
        }

        $homeCurrency = CustomerExchangeRate::homeCurrencyCode();
        if ($homeCurrency === '' || strtoupper($supplierCurrency) === strtoupper($homeCurrency)) {
            return 1.0;
        }

        if (! Schema::hasTable('exchange_rates')) {
            return 1.0;
        }

        $date = $tranDate ?? now()->toDateString();
        $row = DB::table('exchange_rates')
            ->where('curr_code', $supplierCurrency)
            ->where('date', '<=', $date)
            ->orderByDesc('date')
            ->first(['rate_sell', 'rate_buy']);

        return self::pickPurchaseRate($row);
    }

    /**
     * Purchase documents use rate_buy; fall back to rate_sell when buy was not entered.
     */
    public static function pickPurchaseRate(?object $row): float
    {
        if (! $row) {
            return 1.0;
        }

        $buy = (float) ($row->rate_buy ?? 0);
        $sell = (float) ($row->rate_sell ?? 0);
        $parsed = $buy > 0.000001 ? $buy : $sell;

        return $parsed > 0.000001 ? $parsed : 1.0;
    }
}
