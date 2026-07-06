<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('recurrent_invoices')) {
            return;
        }

        Schema::table('recurrent_invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('recurrent_invoices', 'last_invoice_trans_no')) {
                $table->unsignedInteger('last_invoice_trans_no')->nullable()->after('last_sent');
            }
            if (! Schema::hasColumn('recurrent_invoices', 'last_invoice_reference')) {
                $table->string('last_invoice_reference', 60)->nullable()->after('last_invoice_trans_no');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('recurrent_invoices')) {
            return;
        }

        Schema::table('recurrent_invoices', function (Blueprint $table) {
            if (Schema::hasColumn('recurrent_invoices', 'last_invoice_reference')) {
                $table->dropColumn('last_invoice_reference');
            }
            if (Schema::hasColumn('recurrent_invoices', 'last_invoice_trans_no')) {
                $table->dropColumn('last_invoice_trans_no');
            }
        });
    }
};
