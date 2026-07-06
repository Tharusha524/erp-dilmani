<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SuppTransSequence
{
    public static function nextTransNo(int $transType): int
    {
        if (! Schema::hasTable('supp_trans')) {
            return 1;
        }

        $max = (int) DB::table('supp_trans')
            ->where('trans_type', $transType)
            ->lockForUpdate()
            ->max('trans_no');

        return max(1, $max + 1);
    }
}
