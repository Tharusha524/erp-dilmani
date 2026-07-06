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
        Schema::create('bom', function (Blueprint $table) {
            $table->id();
            $table->string('parent', 20);
            $table->string('component', 20);
            $table->unsignedBigInteger('work_centre')->default(0);
            $table->string('loc_code', 5)->default('');
            $table->double('quantity')->default(1);
            $table->timestamps();

            $table->foreign('parent')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->foreign('component')->references('stock_id')->on('stock_master')->cascadeOnDelete();
            $table->foreign('work_centre')->references('id')->on('work_centres');
            $table->foreign('loc_code')->references('loc_code')->on('inventory_locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bom');
    }
};
