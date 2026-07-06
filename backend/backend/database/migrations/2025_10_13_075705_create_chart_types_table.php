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
        Schema::create('chart_types', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('name', 60);
            $table->string('class_id', 3);
            $table->string('parent', 10)->nullable();
            $table->tinyInteger('inactive')->default(0);
            $table->timestamps();

            $table->foreign('class_id')->references('cid')->on('chart_class')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chart_types');
    }
};
