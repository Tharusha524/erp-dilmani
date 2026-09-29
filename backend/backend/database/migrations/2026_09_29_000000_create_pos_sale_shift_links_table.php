<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tags a posted sale with the cashier shift that rang it up, purely for
     * the "sales by cashier/shift" report — never read by the invoice
     * posting/GL code, so it carries no accounting weight of its own.
     */
    public function up(): void
    {
        Schema::create('pos_sale_shift_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('debtor_trans_no');
            $table->integer('debtor_trans_type')->default(10);
            $table->foreignId('pos_shift_id')->constrained('pos_shifts')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['debtor_trans_no', 'debtor_trans_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sale_shift_links');
    }
};
