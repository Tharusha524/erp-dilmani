<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClassTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('class_types')->insertOrIgnore([
            [
                'type_name' => 'Assets',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Liabilities',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Equity',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Income',
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'type_name' => 'Cost of Goods Sold',
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'type_name' => 'Expense',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
