<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two new, entirely optional columns on the product table. Both nullable —
 * every existing product keeps working exactly as before, with these
 * fields simply empty until someone chooses to set them. No accounting
 * logic reads these columns; Sales/Inventory/COGS accounts still come
 * entirely from category_id, unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->unsignedBigInteger('brand_id')->nullable()->after('category_id');
            $table->unsignedBigInteger('subcategory_id')->nullable()->after('brand_id');

            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->foreign('subcategory_id')->references('id')->on('subcategories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_master', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['subcategory_id']);
            $table->dropColumn(['brand_id', 'subcategory_id']);
        });
    }
};
