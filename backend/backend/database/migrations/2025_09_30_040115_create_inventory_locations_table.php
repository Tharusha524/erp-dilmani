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
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->string('loc_code')->unique(); 
            $table->string('location_name');         // NOT NULL
            $table->text('delivery_address');        // tinytext → text
            $table->string('phone');                 // NOT NULL
            $table->string('phone2');                // NOT NULL
            $table->string('fax');                   // NOT NULL
            $table->string('email');                 // NOT NULL
            $table->string('contact'); 
            $table->boolean('inactive')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_locations');
    }
};
