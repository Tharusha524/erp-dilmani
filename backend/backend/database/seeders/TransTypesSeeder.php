<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('trans_types')->insertOrIgnore([
            ['id' => 1,  'trans_type' => 0,  'description' => 'Journal Entry'],
            ['id' => 2,  'trans_type' => 1,  'description' => 'Bank Payment'],
            ['id' => 3,  'trans_type' => 2,  'description' => 'Bank Deposit'],
            ['id' => 4,  'trans_type' => 4,  'description' => 'Funds Transfer'],
            ['id' => 5,  'trans_type' => 10, 'description' => 'Sales Invoice'],
            ['id' => 6,  'trans_type' => 11, 'description' => 'Customer Credit Note'],
            ['id' => 7,  'trans_type' => 12, 'description' => 'Customer Payment'],
            ['id' => 8,  'trans_type' => 13, 'description' => 'Delivery Note'],
            ['id' => 9,  'trans_type' => 16, 'description' => 'Location Transfer'],
            ['id' => 10, 'trans_type' => 17, 'description' => 'Inventory Adjustment'],
            ['id' => 11, 'trans_type' => 18, 'description' => 'Purchase Order'],
            ['id' => 12, 'trans_type' => 20, 'description' => 'Supplier Invoice'],
            ['id' => 13, 'trans_type' => 21, 'description' => 'Supplier Credit Note'],
            ['id' => 14, 'trans_type' => 22, 'description' => 'Supplier Payment'],
            ['id' => 15, 'trans_type' => 25, 'description' => 'Purchase Order Delivery'],
            ['id' => 16, 'trans_type' => 26, 'description' => 'Work Order'],
            ['id' => 17, 'trans_type' => 28, 'description' => 'Work Order Issue'],
            ['id' => 18, 'trans_type' => 29, 'description' => 'Work Order Production'],
            ['id' => 19, 'trans_type' => 30, 'description' => 'Sales Order'],
            ['id' => 20, 'trans_type' => 32, 'description' => 'Sales Quotation'],
            ['id' => 21, 'trans_type' => 35, 'description' => 'Cost Update'],
            ['id' => 22, 'trans_type' => 40, 'description' => 'Dimension'],
        ]);
    }
}
