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
        Schema::create('sales_people', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('telephone', 50)->nullable();
            $table->string('fax', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->decimal('provision', 8, 2)->default(0);
            $table->decimal('turnover_break_point', 15, 2)->default(0);
            $table->decimal('provision2', 8, 2)->default(0);
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_people');
    }
};
