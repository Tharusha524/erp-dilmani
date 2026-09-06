<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optional product organization data — a Subcategory sits one level under
 * an existing Category (e.g. Category "Grocery" -> Subcategory "Soup").
 * Purely a label; the real accounting mapping (Sales/Inventory/COGS
 * accounts) still comes entirely from the parent Category, unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subcategories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->foreign('category_id')->references('category_id')->on('item_category')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subcategories');
    }
};
