<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds Advance + Balance support to the standalone Internal Service
     * Invoice — stored on the invoice itself (no GL/bank/debtor posting,
     * consistent with this module staying isolated).
     */
    public function up(): void
    {
        Schema::table('internal_service_invoices', function (Blueprint $table) {
            $table->decimal('advance_amount', 15, 2)->default(0)->after('bank_account_id');
            $table->decimal('balance_due', 15, 2)->default(0)->after('advance_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internal_service_invoices', function (Blueprint $table) {
            $table->dropColumn(['advance_amount', 'balance_due']);
        });
    }
};
