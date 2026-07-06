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
        Schema::create('chart_master', function (Blueprint $table) {
            $table->string('account_code', 15)->primary();
            $table->string('account_code2', 15)->default('');
            $table->string('account_name', 60);
            $table->string('account_type', 10);
            $table->tinyInteger('inactive')->default(0);
            $table->timestamps();

            $table->foreign('account_type')->references('id')->on('chart_types')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chart_master');
    }
};
