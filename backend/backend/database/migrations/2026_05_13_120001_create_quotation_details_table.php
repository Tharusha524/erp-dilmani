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
        Schema::create('quotation_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quotation_id');
            $table->integer('trans_type')->index();
            $table->string('stk_code');
            $table->longText('description')->nullable();
            $table->decimal('quantity', 15, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('line_total', 15, 2);
            $table->timestamps();

            // Foreign keys
            $table->foreign('quotation_id')->references('quotation_id')->on('quotations')->onDelete('cascade');
            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
            $table->foreign('stk_code')->references('stock_id')->on('stock_master');

            // Indexes
            $table->index('quotation_id');
            $table->index('stk_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_details');
    }
};
