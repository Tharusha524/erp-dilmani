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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id('supplier_id');
            $table->string('supp_name', 60);
            $table->string('supp_short_name', 30);
            $table->string('gst_no', 25)->default('');
            $table->string('website', 100)->default('');
            $table->char('curr_code', 10)->nullable();
            $table->unsignedBigInteger('tax_group')->nullable();
            $table->string('supp_account_no', 40)->default('');
            $table->string('bank_account', 60)->default('');
            $table->double('credit_limit')->default(0);
            $table->unsignedBigInteger('payment_terms')->nullable();
            $table->boolean('tax_included')->default(false);
            $table->string('payable_account', 15)->nullable();
            $table->string('purchase_account', 15)->nullable();
            $table->string('payment_discount_account', 15)->nullable();
            $table->string('contact', 60)->default('');
            $table->integer('dimension_id')->default(0);
            $table->integer('dimension2_id')->default(0);
            $table->text('mail_address');
            $table->text('bill_address');
            $table->text('notes');
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->foreign('curr_code')->references('currency_abbreviation')->on('currencies')->onDelete('set null');
            $table->foreign('tax_group')->references('id')->on('tax_groups')->onDelete('set null');
            $table->foreign('payment_terms')->references('terms_indicator')->on('payment_terms')->onDelete('set null');
            $table->foreign('payable_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('purchase_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('payment_discount_account')->references('account_code')->on('chart_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
