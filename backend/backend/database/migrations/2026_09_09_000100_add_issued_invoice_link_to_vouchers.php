<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a voucher back to the real sales invoice that was posted when it
 * was issued (Dr Cash, Cr Vouchers Payable) — nullable, since a voucher
 * issued without a branch/payment method still just records the row with
 * no accounting entry (unchanged legacy behaviour for existing callers).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('issued_debtor_trans_no')->nullable()->after('note');
            $table->integer('issued_debtor_trans_type')->nullable()->after('issued_debtor_trans_no');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['issued_debtor_trans_no', 'issued_debtor_trans_type']);
        });
    }
};
