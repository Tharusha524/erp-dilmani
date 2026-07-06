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
        Schema::create('supp_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('supp_trans_no')->nullable();
            $table->integer('supp_trans_type')->nullable();
            $table->string('gl_code', 15)->default('');
            $table->unsignedBigInteger('grn_item_id')->nullable();
            $table->unsignedBigInteger('po_detail_item_id')->nullable();
            $table->string('stock_id', 20)->default('');
            $table->tinyText('description')->nullable();
            $table->double('quantity')->default(0);
            $table->double('unit_price')->default(0);
            $table->double('unit_tax')->default(0);
            $table->tinyText('memo')->nullable();
            $table->integer('dimension_id')->default(0);
            $table->integer('dimension2_id')->default(0);
            $table->timestamps();

            $table->foreign('supp_trans_no')->references('trans_no')->on('supp_trans')->nullOnDelete();
            $table->foreign('supp_trans_type')->references('trans_type')->on('supp_trans')->nullOnDelete();
            $table->foreign('grn_item_id')->references('id')->on('grn_items')->nullOnDelete();
            $table->foreign('po_detail_item_id')->references('po_detail_item')->on('purch_order_details')->nullOnDelete();
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supp_invoice_items');
    }
};
