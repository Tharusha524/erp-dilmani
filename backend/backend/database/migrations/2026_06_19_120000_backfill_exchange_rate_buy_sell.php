<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Exchange rate UI historically saved rate_buy only; sales posting reads rate_sell.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exchange_rates')) {
            return;
        }

        DB::table('exchange_rates')
            ->where('rate_buy', '>', 0)
            ->where(function ($q) {
                $q->whereNull('rate_sell')->orWhere('rate_sell', '<=', 0);
            })
            ->update(['rate_sell' => DB::raw('rate_buy')]);

        DB::table('exchange_rates')
            ->where('rate_sell', '>', 0)
            ->where(function ($q) {
                $q->whereNull('rate_buy')->orWhere('rate_buy', '<=', 0);
            })
            ->update(['rate_buy' => DB::raw('rate_sell')]);
    }

    public function down(): void
    {
        // Data backfill — no rollback.
    }
};
