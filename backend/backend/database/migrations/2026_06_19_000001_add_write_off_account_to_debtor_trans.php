<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('debtor_trans') && ! Schema::hasColumn('debtor_trans', 'write_off_account')) {
            Schema::table('debtor_trans', function (Blueprint $table) {
                $table->string('write_off_account', 20)->nullable()->after('tax_included');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('debtor_trans') && Schema::hasColumn('debtor_trans', 'write_off_account')) {
            Schema::table('debtor_trans', function (Blueprint $table) {
                $table->dropColumn('write_off_account');
            });
        }
    }
};
