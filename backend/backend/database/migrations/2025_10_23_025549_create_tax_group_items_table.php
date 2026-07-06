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
        Schema::create('tax_group_items', function (Blueprint $table) {
            
            $table->unsignedBigInteger('tax_group_id');
            $table->unsignedBigInteger('tax_type_id');
            $table->boolean('tax_shipping')->default(false);
            $table->timestamps();

            $table->primary(['tax_group_id', 'tax_type_id']);
            // Foreign keys
            $table->foreign('tax_group_id')
                ->references('id')
                ->on('tax_groups')
                ->onDelete('cascade');

            $table->foreign('tax_type_id')
                ->references('id')
                ->on('tax_types')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_group_items');
    }
};
