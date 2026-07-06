<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fa_depreciation_batches', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 60);
            $table->date('period_date');
            $table->unsignedInteger('assets_count')->default(0);
            $table->double('total_amount')->default(0);
            $table->timestamps();
        });

        Schema::create('fa_depreciation_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('fa_depreciation_batches')->cascadeOnDelete();
            $table->string('stock_id');
            $table->unsignedInteger('trans_no');
            $table->date('tran_date');
            $table->double('amount');
            $table->string('expense_account', 15);
            $table->string('accumulated_account', 15);
            $table->timestamps();

            $table->string('period_key', 20)->comment('YYYY-MM period identifier');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->unique(['stock_id', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fa_depreciation_lines');
        Schema::dropIfExists('fa_depreciation_batches');
    }
};
