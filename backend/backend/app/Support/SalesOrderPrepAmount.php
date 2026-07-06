<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** FrontAccounting prepayment / cash sales order prep_amount rules. */
class SalesOrderPrepAmount
{
    /**
     * @param  object|array<string, mixed>  $orderOrHeader  sales_orders row or header payload
     */
    public static function resolve(object|array $orderOrHeader): float
    {
        $data = is_array($orderOrHeader) ? $orderOrHeader : (array) $orderOrHeader;

        $existing = round((float) ($data['prep_amount'] ?? 0), 2);
        if ($existing > 0) {
            return $existing;
        }

        $termsIndicator = $data['payment_terms'] ?? null;
        if ($termsIndicator === null || $termsIndicator === '') {
            return 0.0;
        }

        if (! Schema::hasTable('payment_terms')) {
            return 0.0;
        }

        $term = DB::table('payment_terms')->where('terms_indicator', $termsIndicator)->first();
        if (! $term) {
            return 0.0;
        }

        $typeName = '';
        if (Schema::hasTable('payment_types') && $term->payment_type) {
            $typeName = strtolower((string) (DB::table('payment_types')
                ->where('id', $term->payment_type)
                ->value('name') ?? ''));
        }

        $isPrepay = (int) ($term->days_before_due ?? 0) === -1
            || str_contains($typeName, 'prepay');
        $isCash = str_contains($typeName, 'cash')
            || ((int) ($term->days_before_due ?? 0) === 0 && ! $isPrepay);

        if (! $isPrepay && ! $isCash) {
            return 0.0;
        }

        return round((float) ($data['total'] ?? 0), 2);
    }

    public static function requiresPrepayment(object|array $orderOrHeader): bool
    {
        return self::resolve($orderOrHeader) > 0.001;
    }
}
