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
        Schema::create('purch_order_details', function (Blueprint $table) {
            $table->id('po_detail_item');
            $table->integer('order_no');
            $table->string('item_code');
            $table->tinyText('description')->nullable();
            $table->date('delivery_date');
            $table->double('qty_invoiced')->default(0);
            $table->double('unit_price')->default(0);
            $table->double('act_price')->default(0);
            $table->double('std_cost_unit')->default(0);
            $table->double('quantity_ordered')->default(0);
            $table->double('quantity_received')->default(0);
            $table->timestamps();

            $table->foreign('order_no')->references('order_no')->on('purch_orders')->onDelete('cascade');
            $table->foreign('item_code')->references('stock_id')->on('stock_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purch_order_details');
    }
};
