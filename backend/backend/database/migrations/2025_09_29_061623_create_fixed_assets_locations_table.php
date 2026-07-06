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
        Schema::create('fixed_assets_locations', function (Blueprint $table) {
            $table->id();
            $table->string('locationCode', 5)->default('');
            $table->string('locationName', 60)->default('');
            $table->text('address');
            $table->string('phone', 30)->default('');
            $table->string('secondaryPhone', 30)->default('');
            $table->string('fax', 30)->default('');
            $table->string('email', 100)->default('');
            $table->string('contact', 30)->default('');
            $table->boolean('fixedAsset')->default(0);
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fixed_assets_locations');
    }
};
