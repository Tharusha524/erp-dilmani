<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Tags which card brand was used on a given payment — purely a
        // reporting label, recorded AFTER a sale is already posted. Never
        // read by invoice posting/GL logic, so it can't affect accounting.
        Schema::create('pos_payment_card_types', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('debtor_trans_no');
            $table->unsignedInteger('debtor_trans_type');
            $table->unsignedBigInteger('bank_account_id')->nullable();
            $table->foreignId('card_type_id')->constrained('card_types');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_payment_card_types');
        Schema::dropIfExists('card_types');
    }
};
