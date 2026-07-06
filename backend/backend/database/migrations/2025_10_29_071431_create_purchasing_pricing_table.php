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
        Schema::create('purchasing_pricing', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_id');
            $table->char('stock_id', 255);
            $table->double('price');
            $table->char('suppliers_uom', 50);
            $table->double('conversion_factor');
            $table->char('supplier_description', 255);

            // Composite primary key
            $table->primary(['supplier_id', 'stock_id']);

            // Foreign keys
            $table->foreign('supplier_id')->references('supplier_id')->on('suppliers')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->onUpdate('cascade')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchasing_pricing');
    }
};
