<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ItemTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('item_type')->insertOrIgnore([
            [
                'name' => 'Manufactured',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Purchased',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Service',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fixed Asset',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
