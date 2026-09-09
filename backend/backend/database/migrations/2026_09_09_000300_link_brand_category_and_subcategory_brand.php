<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Chains the three organization levels together as requested:
 * Category -> Brand -> Subcategory (e.g. Cosmetics -> Unilever -> Rani
 * Shampoo 250g), instead of Brand and Subcategory being flat, unrelated
 * lists. Brand now belongs to a Category; Subcategory now belongs to a
 * Brand (its Category is implied by that Brand). Both new columns are
 * added nullable so any existing rows keep working, then a best-effort
 * backfill runs before nothing is made required at the DB level (the API
 * enforces "required" going forward).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->after('name');
            $table->foreign('category_id')->references('category_id')->on('item_category')->nullOnDelete();
        });

        Schema::table('subcategories', function (Blueprint $table) {
            $table->unsignedBigInteger('brand_id')->nullable()->after('category_id');
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
        });

        // Backfill: point each existing subcategory at any brand that
        // already shares its category, so old data doesn't just vanish
        // from view once the UI switches to browsing by Brand.
        $subcategories = DB::table('subcategories')->whereNull('brand_id')->get();
        foreach ($subcategories as $sub) {
            $brand = DB::table('brands')->where('category_id', $sub->category_id)->first();
            if ($brand) {
                DB::table('subcategories')->where('id', $sub->id)->update(['brand_id' => $brand->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('subcategories', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
