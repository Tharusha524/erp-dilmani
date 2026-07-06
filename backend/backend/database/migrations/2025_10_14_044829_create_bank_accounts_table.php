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
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('bank_account_name', 60)->default('');
            $table->foreignId('account_type')->constrained('account_types')->onDelete('cascade');
            $table->char('bank_curr_code', 3);
            $table->boolean('default_curr_act')->default(false);
            $table->string('account_gl_code', 15);
            $table->string('bank_charges_act', 15);
            $table->string('bank_name', 60)->default('');
            $table->string('bank_account_number', 100)->default('');
            $table->text('bank_address')->nullable();
            $table->timestamp('last_reconciled_date')->nullable();
            $table->double('ending_reconcile_balance')->default(0);
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->foreign('bank_curr_code')->references('currency_abbreviation')->on('currencies')->onDelete('cascade');
            $table->foreign('account_gl_code')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('bank_charges_act')->references('account_code')->on('chart_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
