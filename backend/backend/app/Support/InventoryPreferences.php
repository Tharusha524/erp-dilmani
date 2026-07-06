<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InventoryPreferences
{
    public static function allowNegativeInventory(): bool
    {
        if (! Schema::hasTable('sys_prefs')) {
            return false;
        }

        return filter_var(
            DB::table('sys_prefs')->where('name', 'allowNegativeInventory')->value('value'),
            FILTER_VALIDATE_BOOLEAN
        );
    }
}
