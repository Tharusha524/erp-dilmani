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
        Schema::create('security_roles', function (Blueprint $table) {
            $table->id();
            $table->string('role', 30)->unique();
            $table->string('description', 50)->nullable();
            $table->text('sections')->nullable();
            $table->text('areas')->nullable();
            $table->boolean('inactive')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_roles');
    }
};
