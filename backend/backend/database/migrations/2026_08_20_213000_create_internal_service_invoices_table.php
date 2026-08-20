<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Standalone storage for the Internal Service Invoice page — deliberately
     * separate from debtor_trans/stock_moves/gl_trans so this page never
     * affects customer balances, stock quantities, or GL/reports elsewhere.
     */
    public function up(): void
    {
        Schema::create('internal_service_invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('debtor_no')->nullable();
            $table->unsignedInteger('branch_code')->nullable();
            $table->date('tran_date');
            $table->date('due_date')->nullable();
            $table->string('order_type', 30)->nullable();
            $table->string('ship_via', 30)->nullable();
            $table->string('payment_terms', 30)->nullable();
            $table->decimal('freight_cost', 15, 2)->default(0);
            $table->string('from_stk_loc', 30)->nullable();
            $table->string('customer_ref', 100)->nullable();
            $table->unsignedInteger('cost_center_id')->nullable();
            $table->text('delivery_address')->nullable();
            $table->string('deliver_to', 255)->nullable();
            $table->text('comments')->nullable();
            $table->string('reference', 60)->nullable();
            $table->boolean('cash_sale')->default(false);
            $table->unsignedInteger('bank_account_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_service_invoices');
    }
};
