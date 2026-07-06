<?php

namespace Database\Seeders;

use App\Support\SysPrefsDefinitions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SysPrefsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        foreach (SysPrefsDefinitions::all() as $pref) {
            DB::table('sys_prefs')->updateOrInsert(
                ['name' => $pref['name']],
                [
                    'category' => $pref['category'],
                    'type' => $pref['type'],
                    'length' => $pref['length'],
                    'value' => $pref['value'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
