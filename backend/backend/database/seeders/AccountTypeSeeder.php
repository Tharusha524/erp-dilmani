<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('account_types')->insertOrIgnore([
            [
                'type_name' => 'Saving Account',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Chequing Account',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Credit Account',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type_name' => 'Cash Account',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
