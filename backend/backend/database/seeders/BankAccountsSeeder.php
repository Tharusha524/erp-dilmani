<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BankAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('bank_accounts')->insertOrIgnore([
            [
                'bank_account_name' => 'Main Checking Account',
                'account_type' => 2, // Chequing Account
                'bank_curr_code' => 'CAD',
                'default_curr_act' => true,
                'account_gl_code' => '1060', // Checking Account GL code
                'bank_charges_act' => '5010', // Cost of Goods Sold (valid GL code)
                'bank_name' => 'Royal Bank of Canada',
                'bank_account_number' => '1234567890',
                'bank_address' => '123 Main Street, Toronto, ON',
                'last_reconciled_date' => now(),
                'ending_reconcile_balance' => 50000.00,
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'bank_account_name' => 'Savings Account',
                'account_type' => 1, // Saving Account
                'bank_curr_code' => 'CAD',
                'default_curr_act' => false,
                'account_gl_code' => '1060', // Checking Account GL code
                'bank_charges_act' => '5010', // Cost of Goods Sold (valid GL code)
                'bank_name' => 'TD Bank',
                'bank_account_number' => '9876543210',
                'bank_address' => '456 Bay Street, Toronto, ON',
                'last_reconciled_date' => now(),
                'ending_reconcile_balance' => 100000.00,
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'bank_account_name' => 'Petty Cash',
                'account_type' => 4, // Cash Account
                'bank_curr_code' => 'CAD',
                'default_curr_act' => false,
                'account_gl_code' => '1065', // Petty Cash GL code
                'bank_charges_act' => '5010', // Cost of Goods Sold (valid GL code)
                'bank_name' => 'Cash Box',
                'bank_account_number' => 'PETTY-001',
                'bank_address' => '123 Main Street, Suite 100',
                'last_reconciled_date' => now(),
                'ending_reconcile_balance' => 5000.00,
                'inactive' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
