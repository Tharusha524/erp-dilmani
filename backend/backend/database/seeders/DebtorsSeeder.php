<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DebtorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('debtors_master')->insertOrIgnore([
            [
                'debtor_no' => 1,
                'name' => 'Acme Corporation',
                'debtor_ref' => 'ACME-001',
                'address' => '123 Business Street, New York',
                'gst' => 'GST123456789',
                'curr_code' => 'USD',
                'sales_type' => 1,
                'dimension_id' => 0,
                'dimension2_id' => 0,
                'credit_status' => 0,
                'payment_terms' => null,
                'discount' => 0,
                'pymt_discount' => 0,
                'credit_limit' => 50000,
                'notes' => 'Quotation test customer',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'debtor_no' => 2,
                'name' => 'Tech Solutions Ltd',
                'debtor_ref' => 'TECH-002',
                'address' => '456 Tech Avenue, London',
                'gst' => 'GST987654321',
                'curr_code' => 'USD',
                'sales_type' => 1,
                'dimension_id' => 0,
                'dimension2_id' => 0,
                'credit_status' => 0,
                'payment_terms' => null,
                'discount' => 0,
                'pymt_discount' => 0,
                'credit_limit' => 75000,
                'notes' => 'Premium customer',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
