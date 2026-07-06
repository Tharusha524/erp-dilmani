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
        Schema::create('debtors_master', function (Blueprint $table) {
            $table->id('debtor_no');
            $table->string('name', 100)->default('');
            $table->string('debtor_ref', 30);
            $table->tinyText('address')->nullable();
            $table->string('gst', 55)->default('');           
            $table->string('curr_code', 3);           
            $table->unsignedBigInteger('sales_type')->default(1);            
            $table->unsignedBigInteger('dimension_id')->default(0);
            $table->unsignedBigInteger('dimension2_id')->default(0);
            $table->unsignedBigInteger('credit_status')->default(0);
            $table->unsignedBigInteger('payment_terms')->nullable();
            $table->double('discount')->default(0);
            $table->double('pymt_discount')->default(0);
            $table->float('credit_limit')->default(1000);
            $table->tinyText('notes')->nullable();
            $table->boolean('inactive')->default(0);
            $table->timestamps();

            $table->foreign('curr_code')->references('currency_abbreviation')->on('currencies');
            $table->foreign('sales_type')->references('id')->on('sales_types');
            $table->foreign('credit_status')->references('id')->on('credit_status_setups');
            $table->foreign('payment_terms')->references('terms_indicator')->on('payment_terms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('debtors_master');
    }
};
