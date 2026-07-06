<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('supp_allocations') || ! Schema::hasTable('supp_trans')) {
            return;
        }

        DB::statement('
            UPDATE supp_trans st
            SET alloc = COALESCE((
                SELECT SUM(sa.amount)
                FROM supp_allocations sa
                WHERE sa.trans_no_from = st.trans_no
                  AND sa.trans_type_from = st.trans_type
            ), 0)
            WHERE st.trans_type IN (21, 22)
        ');

        DB::statement('
            UPDATE supp_trans st
            SET alloc = COALESCE((
                SELECT SUM(sa.amount)
                FROM supp_allocations sa
                WHERE sa.trans_no_to = st.trans_no
                  AND sa.trans_type_to = st.trans_type
            ), 0)
            WHERE st.trans_type = 20
        ');
    }

    public function down(): void
    {
        // Data repair only; no rollback.
    }
};
