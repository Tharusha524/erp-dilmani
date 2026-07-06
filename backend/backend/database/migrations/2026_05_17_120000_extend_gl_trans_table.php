<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('gl_trans')) {
            return;
        }

        Schema::table('gl_trans', function (Blueprint $table) {
            if (!Schema::hasColumn('gl_trans', 'type')) {
                $table->string('type', 20)->nullable()->index();
            }
            if (!Schema::hasColumn('gl_trans', 'reference')) {
                $table->string('reference', 60)->nullable()->index();
            }
            if (!Schema::hasColumn('gl_trans', 'date')) {
                $table->date('date')->nullable()->index();
            }
            if (!Schema::hasColumn('gl_trans', 'account')) {
                $table->string('account', 15)->nullable()->index();
            }
            if (!Schema::hasColumn('gl_trans', 'dimension')) {
                $table->unsignedBigInteger('dimension')->nullable();
            }
            if (!Schema::hasColumn('gl_trans', 'debit')) {
                $table->double('debit')->default(0);
            }
            if (!Schema::hasColumn('gl_trans', 'credit')) {
                $table->double('credit')->default(0);
            }
            if (!Schema::hasColumn('gl_trans', 'memo')) {
                $table->text('memo')->nullable();
            }
            // FrontAccounting journal inquiry compatibility
            if (!Schema::hasColumn('gl_trans', 'amount')) {
                $table->double('amount')->default(0);
            }
            if (!Schema::hasColumn('gl_trans', 'tran_date')) {
                $table->date('tran_date')->nullable();
            }
            if (!Schema::hasColumn('gl_trans', 'type_no')) {
                $table->unsignedInteger('type_no')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('gl_trans')) {
            return;
        }

        Schema::table('gl_trans', function (Blueprint $table) {
            foreach (['type', 'reference', 'date', 'account', 'dimension', 'debit', 'credit', 'memo', 'amount', 'tran_date', 'type_no'] as $col) {
                if (Schema::hasColumn('gl_trans', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
