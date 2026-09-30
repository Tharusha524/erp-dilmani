<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A temporary selling price for a date range — checked live at every
     * price lookup (BarcodeLookupController::resolveSalePrice), never a
     * background job, so "auto-revert" just means the range has passed,
     * nothing to schedule or clean up. Separate from sales_pricing, which
     * stays the permanent price Set Price manages.
     */
    public function up(): void
    {
        Schema::create('promotional_prices', function (Blueprint $table) {
            $table->id();
            $table->string('stock_id', 20);
            $table->double('promo_price');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->index(['stock_id', 'active', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotional_prices');
    }
};
