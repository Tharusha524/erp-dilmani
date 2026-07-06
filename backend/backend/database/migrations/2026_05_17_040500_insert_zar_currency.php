<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert ZAR currency if not exists
        $exists = DB::table('currencies')->where('currency_abbreviation', 'ZAR')->exists();
        if (! $exists) {
            DB::table('currencies')->insert([
                'currency_abbreviation' => 'ZAR',
                'currency_symbol' => 'R',
                'currency_name' => 'South African Rand',
                'hundredths_name' => 'Cent',
                'country' => 'South Africa',
                'auto_exchange_rate_update' => 0,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('currencies')->where('currency_abbreviation', 'ZAR')->delete();
    }
};