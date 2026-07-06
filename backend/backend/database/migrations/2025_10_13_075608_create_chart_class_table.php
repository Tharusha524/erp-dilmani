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
        Schema::create('chart_class', function (Blueprint $table) {
            $table->string('cid', 3)->primary();
            $table->string('class_name', 60);
            $table->unsignedBigInteger('ctype')->default(0);
            $table->tinyInteger('inactive')->default(0);
            $table->timestamps();

            $table->foreign('ctype')->references('id')->on('class_types')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chart_class');
    }
};
