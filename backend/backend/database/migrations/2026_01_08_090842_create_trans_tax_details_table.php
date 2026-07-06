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
        Schema::create('trans_tax_details', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('trans_type')->nullable();
            $table->integer('trans_no')->nullable();
            $table->date('tran_date');

            $table->integer('tax_type_id')->default(0);
            $table->double('rate')->default(0);
            $table->double('ex_rate')->default(1);

            $table->boolean('included_in_price')->default(false);

            $table->double('net_amount')->default(0);
            $table->double('amount')->default(0);

            $table->tinyText('memo')->nullable();
            $table->tinyInteger('reg_type')->nullable();

            $table->index(['trans_type', 'trans_no'], 'Type_and_Number');
            $table->index('tran_date');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trans_tax_details');
    }
};
