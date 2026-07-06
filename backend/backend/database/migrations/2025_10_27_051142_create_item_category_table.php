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
        Schema::create('item_category', function (Blueprint $table) {
            $table->id('category_id');
            $table->string('description')->unique();
            $table->unsignedBigInteger('dflt_tax_type');
            $table->unsignedBigInteger('dflt_units');
            $table->unsignedBigInteger('dflt_mb_flag');
            $table->string('dflt_sales_act');
            $table->string('dflt_cogs_act');
            $table->string('dflt_inventory_act');
            $table->string('dflt_adjustment_act');
            $table->string('dflt_wip_act');
            $table->integer('dflt_dim1')->nullable();
            $table->integer('dflt_dim2')->nullable();
            $table->boolean('inactive')->default(0);
            $table->boolean('dflt_no_sale')->default(0);
            $table->boolean('dflt_no_purchase')->default(0);
            $table->timestamps();

            $table->foreign('dflt_tax_type')->references('id')->on('item_tax_types')->onDelete('cascade');
            $table->foreign('dflt_units')->references('id')->on('item_units')->onDelete('cascade');
            $table->foreign('dflt_mb_flag')->references('id')->on('item_type')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_category');
    }
};
