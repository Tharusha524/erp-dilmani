<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GlTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('gl_types')->insertOrIgnore([
            [
                'type' => 'Numeric',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'Alpha Numeric',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'ALPHA NUMERIC',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
