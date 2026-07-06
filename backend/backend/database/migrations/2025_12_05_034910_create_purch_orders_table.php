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
        Schema::create('purch_orders', function (Blueprint $table) {
        $table->integer('order_no')->primary();
        $table->unsignedBigInteger('supplier_id');
        $table->tinyText('comments')->nullable();
        $table->date('ord_date');
        $table->tinyText('reference');
        $table->tinyText('requisition_no')->nullable();
        $table->string('into_stock_location', 5)->default('');
        $table->tinyText('delivery_address');
        $table->double('total')->default(0);
        $table->double('prep_amount')->default(0);
        $table->double('alloc')->default(0);
        $table->boolean('tax_included')->default(false);
        $table->timestamps();

        $table->foreign('supplier_id')->references('supplier_id')->on('suppliers');
        $table->foreign('into_stock_location')->references('loc_code')->on('inventory_locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purch_orders');
    }
};
