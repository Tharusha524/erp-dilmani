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
        Schema::create('supp_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('person_id')->nullable();
            $table->double('amount')->unsigned()->nullable();
            $table->date('date_alloc')->nullable();
            $table->integer('trans_no_from')->nullable();
            $table->integer('trans_type_from')->nullable();
            $table->integer('trans_no_to')->nullable();
            $table->integer('trans_type_to')->nullable();
            $table->timestamps();

            $table->foreign('person_id')->references('supplier_id')->on('suppliers');
            $table->foreign('trans_type_from')->references('trans_type')->on('trans_types');
            $table->foreign('trans_type_to')->references('trans_type')->on('trans_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supp_allocations');
    }
};
