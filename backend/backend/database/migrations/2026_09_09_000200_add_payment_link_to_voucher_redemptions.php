<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a redemption to the customer-payment transaction that was posted
 * for it (Dr Vouchers Payable, Cr Debtor, allocated to the sale) — nullable,
 * since a redemption with no linked invoice still just adjusts the balance
 * with no accounting entry (unchanged legacy behaviour).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voucher_redemptions', function (Blueprint $table) {
            $table->unsignedBigInteger('payment_trans_no')->nullable()->after('amount_used');
        });
    }

    public function down(): void
    {
        Schema::table('voucher_redemptions', function (Blueprint $table) {
            $table->dropColumn('payment_trans_no');
        });
    }
};
