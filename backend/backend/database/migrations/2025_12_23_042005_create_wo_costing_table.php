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
        Schema::create('wo_costing', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workorder_id')->default(0);
            $table->tinyInteger('cost_type')->default(0);
            $table->integer('trans_type')->default(0);
            $table->integer('trans_no')->default(0);
            $table->double('factor')->default(1);
            $table->timestamps();

            $table->foreign('workorder_id')->references('id')->on('workorders')->cascadeOnDelete();
            $table->foreign('trans_type')->references('trans_type')->on('trans_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_costing');
    }
};
