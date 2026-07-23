<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the problematic foreign keys that reference non-unique columns
        // debtor_trans.trans_no is not unique (multiple trans_type values per trans_no)
        // so we cannot have a FK constraint on it
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            try {
                if (config('database.default') !== 'sqlite') {
                    $table->dropForeign('debtor_trans_details_debtor_trans_no_foreign');
                }
            } catch (\Exception $e) {
                // FK might not exist
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the foreign key if needed
        Schema::table('debtor_trans_details', function (Blueprint $table) {
            $table->foreign('debtor_trans_no')
                  ->references('trans_no')
                  ->on('debtor_trans')
                  ->onDelete('cascade');
        });
    }
};
