<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReflinesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('reflines')->insertOrIgnore([
            ['id' => 1,  'trans_type' => 0,  'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 2,  'trans_type' => 1,  'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 3,  'trans_type' => 2,  'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 4,  'trans_type' => 4,  'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 5,  'trans_type' => 10, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 6,  'trans_type' => 11, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 7,  'trans_type' => 12, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 8,  'trans_type' => 13, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 9,  'trans_type' => 16, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 10, 'trans_type' => 17, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 11, 'trans_type' => 18, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 12, 'trans_type' => 20, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 13, 'trans_type' => 21, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 14, 'trans_type' => 22, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 15, 'trans_type' => 25, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 16, 'trans_type' => 26, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 17, 'trans_type' => 28, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 18, 'trans_type' => 29, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 19, 'trans_type' => 30, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 20, 'trans_type' => 32, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 21, 'trans_type' => 35, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
            ['id' => 22, 'trans_type' => 40, 'prefix' => '', 'pattern' => '{001}/{YYYY}', 'memo' => '', 'default' => 1, 'inactive' => 0],
        ]);
    }
}
