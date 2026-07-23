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
        Schema::create('wo_sheet_order_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wo_sheet_order_id')
                ->constrained('wo_sheet_orders')->cascadeOnDelete();

            $table->string('category', 30); // GENTS | LADIES | BOYS | PRESCHOOL
            $table->string('size_label', 10); // XS, S, M, L, XL, 2XL...5XL, 4-7
            $table->unsignedInteger('quantity')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_sheet_order_sizes');
    }
};
