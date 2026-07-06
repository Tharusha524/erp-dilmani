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
        Schema::create('stock_master', function (Blueprint $table) {
            $table->string('stock_id')->primary();
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('tax_type_id');
            $table->string('description');
            $table->tinyText('long_description');
            $table->unsignedBigInteger('units');
            $table->unsignedBigInteger('mb_flag');
            $table->string('sales_account');
            $table->string('cogs_account');
            $table->string('inventory_account');
            $table->string('adjustment_account');
            $table->string('wip_account');
            $table->unsignedBigInteger('dimension_id')->nullable();
            $table->unsignedBigInteger('dimension2_id')->nullable();
            $table->double('purchase_cost');
            $table->double('material_cost');
            $table->double('labour_cost');
            $table->double('overhead_cost');
            $table->boolean('inactive')->default(0);
            $table->boolean('no_sale')->default(0);
            $table->boolean('no_purchase')->default(0);
            $table->boolean('editable')->default(1);
            $table->char('depreciation_method', 1)->nullable();
            $table->double('depreciation_rate');
            $table->double('depreciation_factor');
            $table->date('depreciation_start');
            $table->date('depreciation_date');
            $table->string('image')->nullable();
            $table->string('fa_class_id')->nullable();

            // Optional timestamps (remove if not needed)
            $table->timestamps();

            // Foreign key constraints (if related tables exist)
            $table->foreign('category_id')->references('category_id')->on('item_category')->onDelete('cascade');
            $table->foreign('tax_type_id')->references('id')->on('item_tax_types')->onDelete('cascade');
            $table->foreign('mb_flag')->references('id')->on('item_type')->onDelete('cascade');
            $table->foreign('units')->references('id')->on('item_units')->onDelete('cascade');
            $table->foreign('fa_class_id')->references('fa_class_id')->on('stock_fa_class')->onDelete('cascade');

            $table->foreign('sales_account')->references('account_code')->on('chart_master')->onDelete('restrict');
            $table->foreign('cogs_account')->references('account_code')->on('chart_master')->onDelete('restrict');
            $table->foreign('inventory_account')->references('account_code')->on('chart_master')->onDelete('restrict');
            $table->foreign('adjustment_account')->references('account_code')->on('chart_master')->onDelete('restrict');
            $table->foreign('wip_account')->references('account_code')->on('chart_master')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_master');
    }
};
