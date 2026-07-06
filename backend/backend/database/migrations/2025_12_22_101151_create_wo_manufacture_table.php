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
        Schema::create('wo_manufacture', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 100)->nullable();
            $table->unsignedBigInteger('workorder_id');
            $table->double('quantity')->default(0);
            $table->date('date')->nullable();
            $table->timestamps();

            $table->foreign('workorder_id')->references('id')->on('workorders')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wo_manufacture');
    }
};
