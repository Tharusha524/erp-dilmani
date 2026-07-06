<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('budget_trans')) {
            return;
        }

        Schema::table('budget_trans', function (Blueprint $table) {
            if (! Schema::hasColumn('budget_trans', 'dimension2_id')) {
                $table->unsignedBigInteger('dimension2_id')->default(0)->after('dimension_id');
            }
        });

        if (Schema::hasColumn('budget_trans', 'dimension2_id')) {
            try {
                Schema::table('budget_trans', function (Blueprint $table) {
                    $table->dropUnique('budget_trans_unique');
                });
            } catch (\Throwable) {
                /* index may differ */
            }

            Schema::table('budget_trans', function (Blueprint $table) {
                $table->unique(
                    ['fiscal_year_id', 'account', 'dimension_id', 'dimension2_id', 'tran_date'],
                    'budget_trans_unique'
                );
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('budget_trans') || ! Schema::hasColumn('budget_trans', 'dimension2_id')) {
            return;
        }

        try {
            Schema::table('budget_trans', function (Blueprint $table) {
                $table->dropUnique('budget_trans_unique');
            });
        } catch (\Throwable) {
            /* ignore */
        }

        Schema::table('budget_trans', function (Blueprint $table) {
            $table->dropColumn('dimension2_id');
            $table->unique(['fiscal_year_id', 'account', 'dimension_id', 'tran_date'], 'budget_trans_unique');
        });
    }
};
