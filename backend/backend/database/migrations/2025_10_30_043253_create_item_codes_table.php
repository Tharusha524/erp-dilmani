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
        Schema::create('item_codes', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 20);
            $table->string('stock_id', 20);
            $table->string('description', 200)->default('');
            $table->unsignedBigInteger('category_id');
            $table->integer('quantity')->default(1);
            $table->boolean('is_foreign')->default(0);
            $table->boolean('inactive')->default(0);
            $table->timestamps();

            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->onDelete('cascade');
            $table->foreign('category_id')->references('category_id')->on('item_category')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_codes');
    }
};
