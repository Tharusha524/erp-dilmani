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
        Schema::create('company_setup', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address');
            $table->string('domicile');
            $table->string('phone_number');
            $table->string('fax_number')->nullable();
            $table->string('email_address');
            $table->string('bcc_address')->nullable();
            $table->string('official_company_number');
            $table->string('GSTNo');
            $table->unsignedBigInteger('home_currency_id');
            $table->string('new_company_logo')->nullable();
            $table->boolean('delete_company_logo')->default(false);
            $table->boolean('timezone_on_reports')->default(false);
            $table->boolean('company_logo_on_reports')->default(false);
            $table->boolean('use_barcodes_on_stocks')->default(false);
            $table->boolean('auto_increase_of_document_references')->default(false);
            $table->boolean('use_dimensions_on_recurrent_invoices')->default(false);
            $table->boolean('use_long_descriptions_on_invoices')->default(false);
            $table->boolean('company_logo_on_views')->default(false);
            $table->unsignedBigInteger('fiscal_year_id');
            $table->integer('tax_periods')->nullable();
            $table->integer('tax_last_period')->default(1);
            $table->boolean('put_alternative_tax_include_on_docs')->default(false);
            $table->boolean('suppress_tax_rates_on_docs')->default(false);
            $table->boolean('automatic_revaluation_currency_accounts')->default(false);
            $table->unsignedBigInteger('base_auto_price_calculation')->nullable();
            $table->decimal('add_price_from_std_cost', 5, 2)->default(0);
            $table->integer('round_calculated_prices_to_nearest_cents')->default(1);
            $table->boolean('manufacturing_enabled')->default(false);
            $table->boolean('fixed_assets_enabled')->default(false);
            $table->integer('use_dimensions')->default(0);
            $table->boolean('short_name_and_name_in_list')->default(false);
            $table->boolean('open_print_dialog_direct_on_reports')->default(false);
            $table->boolean('search_item_list')->default(false);
            $table->boolean('search_customer_list')->default(false);
            $table->boolean('search_supplier_list')->default(false);
            $table->integer('login_timeout_seconds')->default(600);
            $table->integer('max_day_range_in_documents_days')->default(180);
            $table->timestamps();

            // Foreign keys
            $table->foreign('home_currency_id')->references('id')->on('currencies')->onDelete('restrict');
            $table->foreign('fiscal_year_id')->references('id')->on('fiscal_years')->onDelete('restrict');
            $table->foreign('base_auto_price_calculation')->references('id')->on('sales_types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_setup');
    }
};
