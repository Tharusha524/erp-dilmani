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
        Schema::create('shipping_companies', function (Blueprint $table) {
            $table->id('shipper_id');
            $table->string('shipper_name', 60);
            $table->string('phone', 30)->default('');
            $table->string('phone2', 30)->default('');
            $table->text('contact');
            $table->text('address');
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_companies');
    }
};
