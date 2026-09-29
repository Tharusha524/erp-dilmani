<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * void() on a sales invoice actually deletes the debtor_trans header
     * and its details (see SalesInvoiceService::void) — it only leaves an
     * audit_trail row behind, which has no amount/customer on it. This
     * table snapshots what was voided, purely for the Void Report; it is
     * written by the controller AFTER void() already succeeded, so it
     * never participates in the void's own DB transaction or logic.
     */
    public function up(): void
    {
        Schema::create('voided_sales_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('trans_no');
            $table->integer('trans_type')->default(10);
            $table->unsignedBigInteger('debtor_no')->nullable();
            $table->string('customer_name')->nullable();
            $table->double('amount')->default(0);
            $table->text('memo')->nullable();
            $table->unsignedBigInteger('voided_by')->nullable();
            $table->timestamp('voided_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voided_sales_log');
    }
};
