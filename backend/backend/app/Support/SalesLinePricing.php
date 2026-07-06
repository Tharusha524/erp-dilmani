<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Gross list price and line discount for sales GL (Cr Sales gross + Dr Discount Given).
 * debtor_trans_details may store list unit_price (SO / direct invoice) or legacy net unit_price (old deliveries).
 */
class SalesLinePricing
{
    public static function listUnitPrice(object $detail): float
    {
        $price = (float) ($detail->unit_price ?? 0);
        $discPct = (float) ($detail->discount_percent ?? 0);
        if ($price <= 0) {
            return 0.0;
        }

        $fromSource = self::listUnitPriceFromSource($detail);
        if ($fromSource > 0.001) {
            return $fromSource;
        }

        if ($discPct > 0.001 && $discPct < 100) {
            return round($price / (1 - $discPct / 100), 4);
        }

        return $price;
    }

    public static function lineGross(object $detail): float
    {
        $qty = abs((float) ($detail->quantity ?? 0));

        return round($qty * self::listUnitPrice($detail), 2);
    }

    public static function lineDiscount(object $detail): float
    {
        $discPct = (float) ($detail->discount_percent ?? 0);
        if ($discPct < 0.001) {
            return 0.0;
        }

        $gross = self::lineGross($detail);

        return round($gross * $discPct / 100, 2);
    }

    private static function listUnitPriceFromSource(object $detail): float
    {
        $srcId = (int) ($detail->src_id ?? 0);
        if ($srcId <= 0) {
            return 0.0;
        }

        $transType = (int) ($detail->debtor_trans_type ?? 0);

        if ($transType === 10) {
            $parent = DB::table('debtor_trans_details')->where('id', $srcId)->first();
            if ($parent) {
                $fromParent = self::listUnitPriceFromSource($parent);
                if ($fromParent > 0.001) {
                    return $fromParent;
                }
                $so = self::salesOrderDetailForLine($parent);
                if ($so) {
                    return (float) $so->unit_price;
                }
            }
        }

        if ($transType === 13) {
            $so = self::salesOrderDetailForLine($detail);
            if ($so) {
                return (float) $so->unit_price;
            }
        }

        if ($transType === 11) {
            $parent = DB::table('debtor_trans_details')->where('id', $srcId)->first();
            if ($parent) {
                return self::listUnitPrice($parent);
            }
        }

        $so = DB::table('sales_order_details')->where('id', $srcId)->first();
        if ($so) {
            return (float) $so->unit_price;
        }

        return 0.0;
    }

    private static function salesOrderDetailForLine(object $line): ?object
    {
        $srcId = (int) ($line->src_id ?? 0);
        if ($srcId <= 0) {
            return null;
        }

        return DB::table('sales_order_details')->where('id', $srcId)->first();
    }
}
