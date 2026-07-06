<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting-style sales kit handling (item_codes where item_code = kit SKU).
 */
class SalesKitExploder
{
    public static function isKit(string $itemCode): bool
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '' || ! Schema::hasTable('item_codes')) {
            return false;
        }

        $rows = DB::table('item_codes')
            ->where('item_code', $itemCode)
            ->where('inactive', 0)
            ->count();

        return $rows > 1 || DB::table('item_codes')
            ->where('item_code', $itemCode)
            ->where('inactive', 0)
            ->whereColumn('stock_id', '!=', 'item_code')
            ->exists();
    }

    /**
     * @return array<int, array{stock_id: string, quantity: float}>
     */
    public static function components(string $itemCode): array
    {
        $itemCode = trim($itemCode);
        if ($itemCode === '' || ! self::isKit($itemCode)) {
            return [];
        }

        return DB::table('item_codes')
            ->where('item_code', $itemCode)
            ->where('inactive', 0)
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'stock_id' => (string) $row->stock_id,
                'quantity' => (float) ($row->quantity ?? 1),
            ])
            ->all();
    }

    /**
     * Stock/COGS lines for a document line (kit → components, plain item → self).
     *
     * @return array<int, array{stock_id: string, quantity: float}>
     */
    public static function stockLines(string $stockId, float $lineQty): array
    {
        $components = self::components($stockId);
        if ($components === []) {
            return [['stock_id' => $stockId, 'quantity' => $lineQty]];
        }

        return array_map(
            fn (array $c) => [
                'stock_id' => $c['stock_id'],
                'quantity' => round($lineQty * $c['quantity'], 4),
            ],
            $components
        );
    }
}
