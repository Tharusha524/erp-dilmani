<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FA quantity on hand = SUM(stock_moves.qty) per stock_id (+ optional loc_code).
 */
class StockQuantityQuery
{
    public static function byStockSubquery()
    {
        if (! Schema::hasTable('stock_moves')) {
            return DB::table(DB::raw('(SELECT \'\' as stock_id, 0 as qty) as mv'))->whereRaw('0 = 1');
        }

        return DB::table('stock_moves')
            ->select('stock_id', DB::raw('SUM(qty) as qty'))
            ->groupBy('stock_id');
    }

    public static function byStockAndLocationSubquery()
    {
        if (! Schema::hasTable('stock_moves')) {
            return DB::table(DB::raw('(SELECT \'\' as stock_id, \'\' as loc_code, 0 as qty) as mv'))->whereRaw('0 = 1');
        }

        return DB::table('stock_moves')
            ->select('stock_id', 'loc_code', DB::raw('SUM(qty) as qty'))
            ->groupBy('stock_id', 'loc_code');
    }

    public static function totalValue(): float
    {
        if (! Schema::hasTable('stock_master') || ! Schema::hasTable('stock_moves')) {
            return 0;
        }

        return (float) DB::table('stock_master as sm')
            ->joinSub(self::byStockSubquery(), 'mv', 'sm.stock_id', '=', 'mv.stock_id')
            ->where('sm.inactive', 0)
            ->sum(DB::raw('mv.qty * sm.material_cost'));
    }
}
