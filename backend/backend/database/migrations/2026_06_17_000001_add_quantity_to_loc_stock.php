<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('loc_stock')) {
            return;
        }

        if (! Schema::hasColumn('loc_stock', 'quantity')) {
            Schema::table('loc_stock', function (Blueprint $table) {
                $table->double('quantity')->default(0)->after('reorder_level');
            });
        }

        if (! Schema::hasTable('stock_moves')) {
            return;
        }

        $qtyColumn = Schema::hasColumn('stock_moves', 'qty') ? 'qty' : 'quantity';
        $locColumn = Schema::hasColumn('stock_moves', 'loc_code') ? 'loc_code' : 'location';

        $totals = DB::table('stock_moves')
            ->select('stock_id', $locColumn.' as loc_code', DB::raw('SUM('.$qtyColumn.') as total_qty'))
            ->groupBy('stock_id', $locColumn)
            ->get();

        foreach ($totals as $row) {
            $locCode = strtoupper(trim((string) $row->loc_code));
            $stockId = (string) $row->stock_id;
            if ($locCode === '' || $stockId === '') {
                continue;
            }

            $exists = DB::table('loc_stock')
                ->where('loc_code', $locCode)
                ->where('stock_id', $stockId)
                ->exists();

            if ($exists) {
                DB::table('loc_stock')
                    ->where('loc_code', $locCode)
                    ->where('stock_id', $stockId)
                    ->update(['quantity' => (float) $row->total_qty]);
            } else {
                DB::table('loc_stock')->insert([
                    'loc_code' => $locCode,
                    'stock_id' => $stockId,
                    'reorder_level' => 0,
                    'quantity' => (float) $row->total_qty,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('loc_stock') && Schema::hasColumn('loc_stock', 'quantity')) {
            Schema::table('loc_stock', function (Blueprint $table) {
                $table->dropColumn('quantity');
            });
        }
    }
};
