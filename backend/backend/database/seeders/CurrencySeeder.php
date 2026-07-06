<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('currencies')->insertOrIgnore([
            [
                'currency_abbreviation' => 'CAD',
                'currency_symbol' => '$',
                'currency_name' => 'CA Dollars',
                'hundredths_name' => 'Cents',
                'country' => 'Canada',
                'auto_exchange_rate_update' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'currency_abbreviation' => 'EUR',
                'currency_symbol' => 'â‚¬',
                'currency_name' => 'Euro',
                'hundredths_name' => 'Cents',
                'country' => 'Europe',
                'auto_exchange_rate_update' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'currency_abbreviation' => 'GBP',
                'currency_symbol' => 'Â£',
                'currency_name' => 'Pounds',
                'hundredths_name' => 'Pence',
                'country' => 'England',
                'auto_exchange_rate_update' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'currency_abbreviation' => 'USD',
                'currency_symbol' => '$',
                'currency_name' => 'US Dollars',
                'hundredths_name' => 'Cents',
                'country' => 'United States',
                'auto_exchange_rate_update' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
