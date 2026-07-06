<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvoiceIdentificationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('invoice_identifications')->insertOrIgnore([
            [
                'name' => 'Reference',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
