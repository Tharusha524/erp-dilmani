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
        Schema::create('comments', function (Blueprint $table) {
            $table->integer('type')->default(0);
            $table->integer('id')->default(0);
            $table->date('date_')->nullable();
            $table->tinyText('memo_')->nullable();
            $table->timestamps();

            $table->foreign('type')->references('trans_type')->on('reflines')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
