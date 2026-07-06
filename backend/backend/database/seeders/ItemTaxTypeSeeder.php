<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ItemTaxTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('item_tax_types')->insertOrIgnore([
            [
                'id' => '1',
                'name' => 'Regular',
                'exempt' => 0,
                'inactive' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
