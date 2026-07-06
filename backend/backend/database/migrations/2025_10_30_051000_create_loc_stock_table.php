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
        Schema::create('loc_stock', function (Blueprint $table) {
            $table->char('loc_code', 10);
            $table->char('stock_id', 20);
            $table->double('reorder_level');
            $table->timestamps();

            $table->primary(['loc_code', 'stock_id']);

            $table->foreign('loc_code')
                ->references('loc_code')
                ->on('inventory_locations')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->foreign('stock_id')
                ->references('stock_id')
                ->on('stock_master')
                ->onUpdate('cascade')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loc_stock');
    }
};
