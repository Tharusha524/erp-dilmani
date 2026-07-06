<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaxAlgorithmsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('tax_algorithms')->insertOrIgnore([
            [
                'name' => 'Sum per line taxes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Taxes from total',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
