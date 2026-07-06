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
        Schema::create('debtor_trans_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('debtor_trans_no')->nullable();
            $table->integer('debtor_trans_type')->nullable();
            $table->string('stock_id', 20)->default('');
            $table->tinyText('description')->nullable();
            $table->double('unit_price')->default(0);
            $table->double('unit_tax')->default(0);
            $table->double('quantity')->default(0);
            $table->double('discount_percent')->default(0);
            $table->double('standard_cost')->default(0);
            $table->double('qty_done')->default(0);
            $table->unsignedBigInteger('src_id');
            $table->timestamps();

            $table->foreign('debtor_trans_no')->references('trans_no')->on('debtor_trans')->onDelete('cascade');
            $table->foreign('debtor_trans_type')->references('trans_type')->on('debtor_trans')->onDelete('cascade');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->onDelete('restrict');
           // $table->foreign('src_id')->references('id')->on('sales_order_details')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('debtor_trans_details');
    }
};
