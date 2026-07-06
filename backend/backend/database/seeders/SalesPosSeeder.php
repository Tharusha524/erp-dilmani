<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesPosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('sales_pos')->insertOrIgnore([
            [
                'pos_name' => 'Main POS',
                'cash_sale' => true,
                'credit_sale' => true,
                'pos_location' => 'HQ', // FK to inventory_locations.loc_code
                'pos_account' => 3, // FK to bank_accounts.id (Petty Cash)
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pos_name' => 'Secondary POS',
                'cash_sale' => true,
                'credit_sale' => true,
                'pos_location' => 'WH1', // FK to inventory_locations.loc_code
                'pos_account' => 1, // FK to bank_accounts.id (Main Checking Account)
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'pos_name' => 'Warehouse POS',
                'cash_sale' => false,
                'credit_sale' => true,
                'pos_location' => 'WH2', // FK to inventory_locations.loc_code
                'pos_account' => 2, // FK to bank_accounts.id (Savings Account)
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
