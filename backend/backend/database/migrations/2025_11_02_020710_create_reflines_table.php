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
        Schema::create('reflines', function (Blueprint $table) {
            $table->id();
            $table->integer('trans_type')->notNull()->index();
            $table->char('prefix', 5)->default('');
            $table->string('pattern', 35)->default('1');
            $table->string('memo', 60)->default('');
            $table->boolean('default')->default(0);
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reflines');
    }
};
