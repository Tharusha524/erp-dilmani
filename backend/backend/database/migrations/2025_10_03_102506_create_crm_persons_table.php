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
        Schema::create('crm_persons', function (Blueprint $table) {
            $table->id();
            $table->string('ref', 30);
            $table->string('name', 60);
            $table->string('name2', 60)->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('phone2', 30)->nullable();
            $table->string('fax', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->char('lang', 5)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_persons');
    }
};
