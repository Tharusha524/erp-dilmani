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
        Schema::create('sales_pos', function (Blueprint $table) {
            
            $table->smallIncrements('id'); // PRIMARY KEY (smallint)

            $table->string('pos_name')->unique(); // VARCHAR & UNIQUE

            $table->boolean('cash_sale')->default(0);     // tinyint, NOT NULL
            $table->boolean('credit_sale')->default(0);   // tinyint, NOT NULL

            $table->string('pos_location'); // VARCHAR (FK → inventory_locations.loc_code)
            $table->unsignedBigInteger('pos_account'); // smallint (FK → bank_accounts.id)

            $table->boolean('inactive')->default(0); // tinyint NOT NULL

            // Foreign keys
            $table->foreign('pos_location')
                  ->references('loc_code')
                  ->on('inventory_locations')
                  ->onDelete('cascade');

            $table->foreign('pos_account')
                  ->references('id')
                  ->on('bank_accounts')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_pos');
    }
};
