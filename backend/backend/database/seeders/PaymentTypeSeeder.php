<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('payment_types')->insertOrIgnore([
            [
                'name' => 'Prepayment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Cash',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'After No. of Days',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Day In Following Month',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
