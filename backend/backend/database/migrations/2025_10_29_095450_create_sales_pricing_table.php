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
        Schema::create('sales_pricing', function (Blueprint $table) {
            $table->id();

            $table->string('stock_id');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->onDelete('cascade');

            $table->foreignId('currency_id')->constrained('currencies')->onDelete('cascade');
            $table->foreignId('sales_type_id')->constrained('sales_types')->onDelete('cascade');
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_pricing');
    }
};
