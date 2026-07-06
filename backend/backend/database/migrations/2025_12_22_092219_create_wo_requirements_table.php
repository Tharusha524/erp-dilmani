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
        Schema::create('wo_requirements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workorder_id');
            $table->string('stock_id', 20);
            $table->unsignedBigInteger('work_centre');
            $table->double('units_req')->default(1);
            $table->double('unit_cost')->default(0);
            $table->string('loc_code', 5);
            $table->double('units_issued')->default(0);
            $table->timestamps();

            $table->foreign('workorder_id')->references('id')->on('workorders')->cascadeOnDelete();
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->foreign('work_centre')->references('id')->on('work_centres');
            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_requirements');
    }
};
