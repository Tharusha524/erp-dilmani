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
        Schema::create('grn_batch', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id');
            $table->integer('purch_order_no');
            $table->string('reference');
            $table->date('delivery_date');
            $table->string('loc_code')->default('');
            $table->double('rate')->default(1);
            $table->timestamps();

            $table->foreign('supplier_id')->references('supplier_id')->on('suppliers');
            $table->foreign('purch_order_no')->references('order_no')->on('purch_orders');
            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_batch');
    }
};
