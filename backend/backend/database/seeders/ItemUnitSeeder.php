<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ItemUnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('item_units')->insertOrIgnore([
            [
                'id' => '1',
                'abbr' => 'each',
                'name' => 'Each',
                'decimals' => 0,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '2',
                'abbr' => 'hr',
                'name' => 'Hours',
                'decimals' => 0,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
