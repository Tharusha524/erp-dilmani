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
        Schema::create('crm_categories', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('subtype', 20);
            $table->string('name', 30);
            $table->text('description');
            $table->boolean('systm')->default(false);
            $table->boolean('inactive')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_categories');
    }
};
