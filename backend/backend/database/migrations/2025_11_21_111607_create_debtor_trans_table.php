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
        Schema::create('debtor_trans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('trans_no')->index();
            $table->integer('trans_type')->default(0);
            $table->unsignedTinyInteger('version')->default(0);
            $table->unsignedBigInteger('debtor_no');
            $table->unsignedBigInteger('branch_code')->default(0);
            $table->date('tran_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('reference', 60)->default('');
            $table->unsignedInteger('tpe')->default(0);
            $table->integer('order_no')->default(0);
            $table->double('ov_amount')->default(0);
            $table->double('ov_gst')->default(0);
            $table->double('ov_freight')->default(0);
            $table->double('ov_freight_tax')->default(0);
            $table->double('ov_discount')->default(0);
            $table->double('alloc')->default(0);
            $table->double('prep_amount')->default(0);
            $table->double('rate')->default(1);
            $table->unsignedBigInteger('ship_via')->nullable();
            $table->unsignedBigInteger('dimension_id')->default(0);
            $table->unsignedBigInteger('dimension2_id')->default(0);
            $table->unsignedBigInteger('payment_terms')->nullable();
            $table->boolean('tax_included')->default(0);
            $table->timestamps();

            $table->index(['trans_no', 'trans_type'], 'debtor_trans_no_type_index');

            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
            $table->foreign('debtor_no')->references('debtor_no')->on('debtors_master');
            $table->foreign('branch_code')->references('branch_code')->on('cust_branch');
         //   $table->foreign('order_no')->references('order_no')->on('sales_orders');
            $table->foreign('ship_via')->references('shipper_id')->on('shipping_companies');
            $table->foreign('payment_terms')->references('terms_indicator')->on('payment_terms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('debtor_trans');
    }
};
