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
        Schema::create('stock_moves', function (Blueprint $table) {
            $table->id('trans_id');
            $table->integer('trans_no')->default(0);
            $table->string('stock_id', 20);
            $table->Integer('type')->default(0);
            $table->string('loc_code', 5);
            $table->date('tran_date')->nullable();
            $table->double('price')->default(0);
            $table->string('reference', 40)->nullable();
            $table->double('qty')->default(1);
            $table->double('standard_cost')->default(0);
            $table->timestamps();

            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->onDelete('cascade');
            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations')->onDelete('cascade');
            $table->foreign('type')->references('trans_type')->on('reflines')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_moves');
    }
};
