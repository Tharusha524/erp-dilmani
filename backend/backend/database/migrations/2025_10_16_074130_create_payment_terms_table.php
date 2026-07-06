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
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id('terms_indicator');
            $table->string('description', 80);
            $table->unsignedBigInteger('payment_type');
            $table->smallInteger('days_before_due')->default(0);
            $table->smallInteger('day_in_following_month')->default(0);
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->foreign('payment_type')->references('id')->on('payment_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_terms');
    }
};
