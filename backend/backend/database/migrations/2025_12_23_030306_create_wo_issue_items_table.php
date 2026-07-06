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
        Schema::create('wo_issue_items', function (Blueprint $table) {
            $table->id();
            $table->string('stock_id', 40)->nullable();
            $table->unsignedInteger('issue_id')->nullable();
            $table->double('qty_issued')->nullable();
            $table->double('unit_cost')->default(0);
            $table->timestamps();

            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->foreign('issue_id')->references('issue_no')->on('wo_issues')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_issue_items');
    }
};
