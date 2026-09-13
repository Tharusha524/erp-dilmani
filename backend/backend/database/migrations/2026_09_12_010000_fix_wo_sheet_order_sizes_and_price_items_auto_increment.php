<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Same issue as wo_sheet_orders.id: these two tables' `id` columns also
     * lost AUTO_INCREMENT, causing "Field 'id' doesn't have a default value"
     * whenever a work order's size grid or price line items were saved.
     */
    public function up(): void
    {
        foreach (['wo_sheet_order_sizes', 'wo_sheet_order_price_items'] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");

            $maxId = (int) DB::table($table)->max('id');
            if ($maxId > 0) {
                DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = " . ($maxId + 1));
            }
        }
    }

    public function down(): void
    {
        // Not reversible in a meaningful way; leave AUTO_INCREMENT in place.
    }
};
