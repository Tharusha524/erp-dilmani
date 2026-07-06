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
        Schema::create('sales_order_details', function (Blueprint $table) {
            $table->id();
            $table->integer('order_no')->index();
            $table->integer('trans_type')->default(30);
            $table->string('stk_code', 20)->default('');
            $table->tinyText('description')->nullable();
            $table->double('qty_sent')->default(0);
            $table->double('unit_price')->default(0);
            $table->double('quantity')->default(0);
            $table->double('invoiced')->default(0);
            $table->double('discount_percent')->default(0);
            $table->timestamps();

            $table->foreign('order_no')->references('order_no')->on('sales_orders')->onDelete('cascade');
            $table->foreign('trans_type')->references('trans_type')->on('trans_types')->onDelete('cascade');
            $table->foreign('stk_code')->references('stock_id')->on('stock_master')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_details');
    }
};
