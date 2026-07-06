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
        Schema::create('workorders', function (Blueprint $table) {
            $table->id();
            $table->string('wo_ref', 60)->default('');
            $table->string('loc_code', 5);
            $table->double('units_reqd')->default(1);
            $table->string('stock_id', 20);
            $table->date('date')->nullable();
            $table->integer('type')->default(0);
            $table->date('required_by')->nullable();
            $table->date('released_date')->nullable();
            $table->double('units_issued')->default(0);
            $table->boolean('closed')->default(0);
            $table->boolean('released')->default(0);
            $table->double('additional_costs')->default(0);
            $table->timestamps();

            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations');
            $table->foreign('stock_id')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->foreign('type')->references('trans_type')->on('trans_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workorders');
    }
};
