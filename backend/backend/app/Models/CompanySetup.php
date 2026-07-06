<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanySetup extends Model
{
    use HasFactory;

    protected $table = 'company_setup';

    protected $appends = ['company_logo_url', 'company_logo_available'];

    protected $fillable = [
        'name',
        'address',
        'domicile',
        'phone_number',
        'fax_number',
        'email_address',
        'bcc_address',
        'official_company_number',
        'GSTNo',
        'home_currency_id',
        'new_company_logo',
        'delete_company_logo',
        'timezone_on_reports',
        'company_logo_on_reports',
        'use_barcodes_on_stocks',
        'auto_increase_of_document_references',
        'use_cost_centers_on_recurrent_invoices',
        'use_long_descriptions_on_invoices',
        'company_logo_on_views',
        'fiscal_year_id',
        'tax_periods',
        'tax_last_period',
        'put_alternative_tax_include_on_docs',
        'suppress_tax_rates_on_docs',
        'automatic_revaluation_currency_accounts',
        'base_auto_price_calculation',
        'add_price_from_std_cost',
        'round_calculated_prices_to_nearest_cents',
        'manufacturing_enabled',
        'fixed_assets_enabled',
        'use_cost_centers',
        'short_name_and_name_in_list',
        'open_print_dialog_direct_on_reports',
        'search_item_list',
        'search_customer_list',
        'search_supplier_list',
        'login_timeout_seconds',
        'max_day_range_in_documents_days',
    ];

    protected $casts = [
        'delete_company_logo' => 'boolean',
        'timezone_on_reports' => 'boolean',
        'company_logo_on_reports' => 'boolean',
        'use_barcodes_on_stocks' => 'boolean',
        'auto_increase_of_document_references' => 'boolean',
        'use_cost_centers_on_recurrent_invoices' => 'boolean',
        'use_long_descriptions_on_invoices' => 'boolean',
        'company_logo_on_views' => 'boolean',
        'put_alternative_tax_include_on_docs' => 'boolean',
        'suppress_tax_rates_on_docs' => 'boolean',
        'automatic_revaluation_currency_accounts' => 'boolean',
        'manufacturing_enabled' => 'boolean',
        'fixed_assets_enabled' => 'boolean',
        'short_name_and_name_in_list' => 'boolean',
        'open_print_dialog_direct_on_reports' => 'boolean',
        'search_item_list' => 'boolean',
        'search_customer_list' => 'boolean',
        'search_supplier_list' => 'boolean',
        'use_cost_centers' => 'boolean',
    ];

    public function homeCurrency() 
    {
        return $this->belongsTo(Currency::class, 'home_currency_id');
    }

    public function fiscalYear() 
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year_id');
    }

    public function basePriceCalculation() 
    {
        return $this->belongsTo(SalesType::class, 'base_auto_price_calculation');
    }

    public function getCompanyLogoAvailableAttribute(): bool
    {
        if (!$this->new_company_logo) {
            return false;
        }

        return Storage::disk('public')->exists($this->new_company_logo);
    }

    /** API-relative path; frontend resolves against the configured API base URL. */
    public function getCompanyLogoUrlAttribute(): ?string
    {
        if (!$this->new_company_logo || !$this->company_logo_available) {
            return null;
        }

        return 'company-setup/logo';
    }
}
