<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The `id` column on wo_sheet_orders lost its AUTO_INCREMENT attribute
     * (likely from an earlier manual table change), so every insert failed
     * with "Field 'id' doesn't have a default value". This restores it.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE `wo_sheet_orders` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');

        $maxId = (int) DB::table('wo_sheet_orders')->max('id');
        if ($maxId > 0) {
            DB::statement('ALTER TABLE `wo_sheet_orders` AUTO_INCREMENT = ' . ($maxId + 1));
        }
    }

    public function down(): void
    {
        // Not reversible in a meaningful way; leave AUTO_INCREMENT in place.
    }
};
