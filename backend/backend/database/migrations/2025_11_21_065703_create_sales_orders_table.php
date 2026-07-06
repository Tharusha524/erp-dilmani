<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->integer('order_no')->primary();
            $table->integer('trans_type')->default(30);
            $table->tinyInteger('version')->unsigned()->default(0);
            $table->tinyInteger('type')->default(0);
            $table->unsignedBigInteger('debtor_no')->default(0);
            $table->unsignedBigInteger('branch_code')->default(0);
            $table->string('reference', 100)->default('');
            $table->tinyText('customer_ref')->nullable();
            $table->tinyText('comments')->nullable();
            $table->date('ord_date')->nullable();
            $table->unsignedBigInteger('order_type')->default(0);
            $table->unsignedBigInteger('ship_via')->default(0);
            $table->tinyText('delivery_address');
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email', 100)->nullable();
            $table->tinyText('deliver_to');
            $table->double('freight_cost')->default(0);
            $table->string('from_stk_loc', 5)->default('');
            $table->date('delivery_date')->nullable();
            $table->unsignedBigInteger('payment_terms')->nullable();
            $table->double('total')->default(0);
            $table->double('prep_amount')->default(0);
            $table->double('alloc')->default(0);

            $table->timestamps();

            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
            $table->foreign('debtor_no')->references('debtor_no')->on('debtors_master');
            $table->foreign('branch_code')->references('branch_code')->on('cust_branch');
            $table->foreign('order_type')->references('id')->on('sales_types');
            $table->foreign('ship_via')->references('shipper_id')->on('shipping_companies');
            $table->foreign('from_stk_loc')->references('loc_code')->on('inventory_locations');
            $table->foreign('payment_terms')->references('terms_indicator')->on('payment_terms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
