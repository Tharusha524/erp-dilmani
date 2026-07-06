<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartClassSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('chart_class')->insertOrIgnore([
            [
                'cid' => '1',
                'class_name' => 'Assets',
                'ctype' => 1,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cid' => '2',
                'class_name' => 'Liabilities',
                'ctype' => 2,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cid' => '3',
                'class_name' => 'Income',
                'ctype' => 4,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cid' => '4',
                'class_name' => 'Costs',
                'ctype' => 6,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
