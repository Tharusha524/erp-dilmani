<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wo_sheet_order_price_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wo_sheet_order_id')
                ->constrained('wo_sheet_orders')->cascadeOnDelete();

            $table->string('item_name', 60); // ELDERS, PRESCHOOL, BOYS, SHORTS, BOTTOM, SKINEE, JACKET
            $table->decimal('price', 12, 2)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_order_price_items');
    }
};
