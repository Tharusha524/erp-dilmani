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
        Schema::create('item_tax_type_exceptions', function (Blueprint $table) {
            
            $table->unsignedBigInteger('item_tax_type_id');
            $table->unsignedBigInteger('tax_type_id');

            // Composite primary key
            $table->primary(['item_tax_type_id', 'tax_type_id']);

            // Foreign key constraints
            $table->foreign('item_tax_type_id')
                ->references('id')
                ->on('item_tax_types')
                ->onDelete('cascade');

            $table->foreign('tax_type_id')
                ->references('id')
                ->on('tax_types')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_tax_type_exceptions');
    }
};
