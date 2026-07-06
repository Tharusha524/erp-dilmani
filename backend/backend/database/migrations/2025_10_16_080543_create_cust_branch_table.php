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
        Schema::create('cust_branch', function (Blueprint $table) {
            $table->id('branch_code');
            $table->unsignedBigInteger('debtor_no');
            $table->string('br_name', 60);
            $table->string('branch_ref', 30);
            $table->tinyText('br_address')->nullable();
            $table->unsignedBigInteger('sales_area')->nullable();
            $table->unsignedBigInteger('sales_person')->nullable();
            $table->string('inventory_location', 15)->default('');
            $table->unsignedBigInteger('tax_group')->nullable();
            $table->string('sales_account', 15)->nullable();
            $table->string('sales_discount_account', 15)->nullable();
            $table->string('receivables_account', 15)->nullable();
            $table->string('payment_discount_account', 15)->nullable();
            $table->unsignedBigInteger('shipping_company')->nullable();
            $table->tinyText('br_post_address')->nullable();
            $table->unsignedBigInteger('sales_group')->nullable();
            $table->tinyText('notes')->nullable();
            $table->string('bank_account', 60)->nullable();
            $table->boolean('inactive')->default(false);
            $table->timestamps();

            $table->foreign('debtor_no')->references('debtor_no')->on('debtors_master')->cascadeOnDelete();
            $table->foreign('sales_area')->references('id')->on('sales_areas')->nullOnDelete();
            $table->foreign('sales_person')->references('id')->on('sales_people')->nullOnDelete();
            $table->foreign('inventory_location')->references('loc_code')->on('inventory_locations')->cascadeOnDelete();
            $table->foreign('tax_group')->references('id')->on('tax_groups')->nullOnDelete();
            $table->foreign('shipping_company')->references('shipper_id')->on('shipping_companies')->cascadeOnDelete();
            $table->foreign('sales_group')->references('id')->on('sales_groups')->nullOnDelete();
            $table->foreign('sales_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('sales_discount_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('receivables_account')->references('account_code')->on('chart_master')->onDelete('cascade');
            $table->foreign('payment_discount_account')->references('account_code')->on('chart_master')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cust_branch');
    }
};
