<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('chart_types')->insertOrIgnore([
            [
                'id' => '1',
                'name' => 'Current Assets',
                'class_id' => '1',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '2',
                'name' => 'Inventory Assets',
                'class_id' => '1',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '3',
                'name' => 'Capital Assets',
                'class_id' => '1',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '4',
                'name' => 'Current Liabilities',
                'class_id' => '2',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '5',
                'name' => 'Long Term Liabilities',
                'class_id' => '2',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '6',
                'name' => 'Share Capital',
                'class_id' => '2',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '7',
                'name' => 'Retained Earnings',
                'class_id' => '2',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '8',
                'name' => 'Sales Revenue',
                'class_id' => '3',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '9',
                'name' => 'Other Revenue',
                'class_id' => '3',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '10',
                'name' => 'Cost of Goods Sold',
                'class_id' => '4',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '11',
                'name' => 'Payroll Expenses',
                'class_id' => '4',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'id' => '12',
                'name' => 'General &amp; Administrative expenses',
                'class_id' => '4',
                'parent' => '',
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
