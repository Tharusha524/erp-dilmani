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
        Schema::create('cust_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('person_id')->nullable();

            // Allocation details
            $table->double('amt')->nullable();
            $table->date('date_alloc');

            // From transaction (debtor_trans)
            $table->unsignedInteger('trans_no_from')->nullable();
            $table->integer('trans_type_from')->nullable();

            // To transaction (sales_orders)
            $table->integer('trans_no_to')->nullable();
            $table->integer('trans_type_to')->nullable();

            /*
            |-------------------------------------------------
            | Indexes
            |-------------------------------------------------
            */
            $table->index('person_id');
            $table->index(['trans_no_from', 'trans_type_from']);
            $table->index(['trans_no_to', 'trans_type_to']);

            /*
            |-------------------------------------------------
            | Foreign Keys
            |-------------------------------------------------
            */
            $table->foreign('person_id')
                  ->references('debtor_no')
                  ->on('debtors_master')
                  ->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cust_allocations');
    }
};
