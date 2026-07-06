<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JournalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('journal')->insertOrIgnore([
            [
                'type' => 0,
                'trans_no' => 101,
                'tran_date' => '2026-05-10',
                'reference' => 'REF-001',
                'source_ref' => 'Invoice #INV-001',
                'currency' => 'USD',
                'amount' => 1500.00,
                'rate' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 1,
                'trans_no' => 102,
                'tran_date' => '2026-05-11',
                'reference' => 'REF-002',
                'source_ref' => 'Invoice #INV-002',
                'currency' => 'USD',
                'amount' => 2500.00,
                'rate' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 2,
                'trans_no' => 103,
                'tran_date' => '2026-05-12',
                'reference' => 'REF-003',
                'source_ref' => 'Payment #PAY-001',
                'currency' => 'USD',
                'amount' => 500.00,
                'rate' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 4,
                'trans_no' => 104,
                'tran_date' => '2026-05-13',
                'reference' => 'REF-004',
                'source_ref' => 'Transfer #TRF-001',
                'currency' => 'USD',
                'amount' => 3000.00,
                'rate' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 10,
                'trans_no' => 105,
                'tran_date' => '2026-05-14',
                'reference' => 'REF-005',
                'source_ref' => 'Invoice #INV-003',
                'currency' => 'USD',
                'amount' => 750.50,
                'rate' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

