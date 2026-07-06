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
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id('id');
            $table->unsignedBigInteger('grn_batch_id')->nullable();
            $table->unsignedBigInteger('po_detail_item')->default(0);
            $table->string('item_code', 20)->default('');
            $table->tinyText('description')->nullable();
            $table->double('qty_recd')->default(0);
            $table->double('quantity_inv')->default(0);
            $table->timestamps();

            $table->foreign('grn_batch_id')->references('id')->on('grn_batch')->onDelete('set null');
            $table->foreign('po_detail_item')->references('po_detail_item')->on('purch_order_details')->onDelete('cascade');
            $table->foreign('item_code')->references('stock_id')->on('stock_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
