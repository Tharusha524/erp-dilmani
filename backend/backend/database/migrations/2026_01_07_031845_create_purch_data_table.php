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
        Schema::create('purch_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id');
            $table->string('stock_id', 20);
            $table->double('price')->default(0);
            $table->char('suppliers_uom', 50)->nullable();
            $table->double('conversion_factor')->default(1);
            $table->char('supplier_description', 50)->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('supplier_id')->on('suppliers');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purch_data');
    }
};
