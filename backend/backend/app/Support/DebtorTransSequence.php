<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DebtorTransSequence
{
    public static function nextTransNo(int $transType): int
    {
        if (! Schema::hasTable('debtor_trans')) {
            return 1;
        }

        $max = (int) DB::table('debtor_trans')
            ->where('trans_type', $transType)
            ->lockForUpdate()
            ->max('trans_no');

        return max(1, $max + 1);
    }
}
