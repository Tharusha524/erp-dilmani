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
        Schema::create('refs', function (Blueprint $table) {
            $table->id();
            $table->integer('type')->default(0);
            $table->string('reference', 100)->default('');
            $table->timestamps();

            $table->foreign('type')->references('trans_type')->on('reflines')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refs');
    }
};
