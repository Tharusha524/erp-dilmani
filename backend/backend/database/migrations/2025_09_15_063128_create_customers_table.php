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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_short_name')->nullable();
            $table->string('address')->nullable();
            $table->string('gst_number')->nullable();
            $table->string('currency')->default('USD');
            $table->string('sales_type')->default('Retail');
            $table->string('phone')->nullable();
            $table->string('secondary_phone')->nullable();
            $table->string('email')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('sales_person')->nullable();
            $table->decimal('discount_percent', 5, 2)->nullable();
            $table->decimal('prompt_payment_discount', 5, 2)->nullable();
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->string('payment_terms')->default('Cash Only');
            $table->string('credit_status')->default('Good History');
            $table->text('general_notes')->nullable();
            $table->string('default_inventory_location')->nullable();
            $table->string('default_shipping_company')->nullable();
            $table->string('sales_area')->nullable();
            $table->string('tax_group')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
