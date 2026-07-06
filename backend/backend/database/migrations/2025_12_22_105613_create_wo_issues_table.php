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
        Schema::create('wo_issues', function (Blueprint $table) {
            $table->unsignedInteger('issue_no')->primary();
            $table->unsignedBigInteger('workorder_id')->default(0);
            $table->string('reference', 100)->nullable();
            $table->date('issue_date')->nullable();
            $table->string('loc_code', 5)->nullable();
            $table->unsignedBigInteger('work_centre')->nullable();
            $table->timestamps();

            $table->foreign('workorder_id')->references('id')->on('workorders')->cascadeOnDelete();
            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations');
            $table->foreign('work_centre')->references('id')->on('work_centres');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_issues');
    }
};
