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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('currency_abbreviation', 10)->unique(); 
            $table->string('currency_symbol', 10);                 
            $table->string('currency_name');                       
            $table->string('hundredths_name')->nullable();         
            $table->string('country');                            
            $table->boolean('auto_exchange_rate_update')->default(false);
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
