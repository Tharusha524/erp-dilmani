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
        Schema::create('bank_trans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bank_act');
            $table->unsignedInteger('trans_no')->nullable();
            $table->integer('type')->nullable();
            $table->string('ref')->nullable();
            $table->date('trans_date');
            $table->double('amount')->nullable();
            $table->unsignedInteger('dimension_id')->nullable();
            $table->unsignedInteger('dimension2_id')->nullable();
            $table->unsignedInteger('person_type_id')->nullable();
            $table->binary('person_id')->nullable();
            $table->date('reconciled')->nullable();
            $table->timestamps();

            $table->foreign('bank_act')->references('id')->on('bank_accounts')->onDelete('cascade');
            $table->foreign('type')->references('trans_type')->on('trans_types');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_trans');
    }
};
