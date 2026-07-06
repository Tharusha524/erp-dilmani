<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Align legacy / FrontAccounting-style stock_moves columns with the Laravel API.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stock_moves')) {
            return;
        }

        Schema::table('stock_moves', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_moves', 'qty') && Schema::hasColumn('stock_moves', 'quantity')) {
                $table->double('qty')->default(0);
            }

            if (! Schema::hasColumn('stock_moves', 'reference') && Schema::hasColumn('stock_moves', 'ref')) {
                $table->string('reference', 40)->nullable();
            }

            if (! Schema::hasColumn('stock_moves', 'tran_date') && Schema::hasColumn('stock_moves', 'date')) {
                $table->date('tran_date')->nullable();
            }
        });

        if (Schema::hasColumn('stock_moves', 'qty') && Schema::hasColumn('stock_moves', 'quantity')) {
            DB::statement('UPDATE stock_moves SET qty = quantity WHERE qty = 0 OR qty IS NULL');
        }

        if (Schema::hasColumn('stock_moves', 'reference') && Schema::hasColumn('stock_moves', 'ref')) {
            DB::statement("UPDATE stock_moves SET reference = ref WHERE reference IS NULL OR reference = ''");
        }

        if (Schema::hasColumn('stock_moves', 'tran_date') && Schema::hasColumn('stock_moves', 'date')) {
            DB::statement('UPDATE stock_moves SET tran_date = date WHERE tran_date IS NULL');
        }
    }

    public function down(): void
    {
        // Non-destructive alignment migration — no rollback.
    }
};
