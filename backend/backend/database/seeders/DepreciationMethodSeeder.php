<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepreciationMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('depreciation_method')->insertOrIgnore([
            [
                'type' => 'D',
                'description' => 'Declining balance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'S',
                'description' => 'Straight line',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'N',
                'description' => 'Sum of the Year Digits',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'O',
                'description' => 'One-time',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
