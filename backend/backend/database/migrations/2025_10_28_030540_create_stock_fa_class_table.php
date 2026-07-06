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
        Schema::create('stock_fa_class', function (Blueprint $table) {
            $table->string('fa_class_id')->primary();
            $table->string('parent_id');
            $table->string('description');
            $table->text('long_description');
            $table->double('depreciation_rate', 8, 2);
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_fa_class');
    }
};
