<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Audit-only: records when a cashier typed a different unit price at
     * checkout than the catalog price the line was added at. Never read by
     * the invoice posting logic — the sale posts at whatever unit_price is
     * on the line either way; this table exists purely for the
     * Price-Override Audit report.
     */
    public function up(): void
    {
        Schema::create('price_override_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('debtor_trans_no');
            $table->integer('debtor_trans_type')->default(10);
            $table->string('stock_id', 20);
            $table->double('original_price');
            $table->double('new_price');
            $table->unsignedBigInteger('cashier_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['debtor_trans_no', 'debtor_trans_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_override_log');
    }
};
