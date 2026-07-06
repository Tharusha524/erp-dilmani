<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompanySetupRequest extends FormRequest
{
  private const BOOLEAN_FIELDS = [
    'delete_company_logo',
    'timezone_on_reports',
    'company_logo_on_reports',
    'use_barcodes_on_stocks',
    'auto_increase_of_document_references',
    'use_cost_centers_on_recurrent_invoices',
    'use_long_descriptions_on_invoices',
    'company_logo_on_views',
    'put_alternative_tax_include_on_docs',
    'suppress_tax_rates_on_docs',
    'automatic_revaluation_currency_accounts',
    'manufacturing_enabled',
    'fixed_assets_enabled',
    'use_cost_centers',
    'short_name_and_name_in_list',
    'open_print_dialog_direct_on_reports',
    'search_item_list',
    'search_customer_list',
    'search_supplier_list',
  ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merged = [];

        foreach (self::BOOLEAN_FIELDS as $field) {
            if ($this->has($field)) {
                $merged[$field] = filter_var(
                    $this->input($field),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) ?? false;
            }
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->isMethod('post')) {
            return [
                'name' => 'required|string|max:255',
                'address' => 'required|string',
                'domicile' => 'required|string|max:255',
                'phone_number' => 'required|string|max:50',
                'fax_number' => 'nullable|string|max:50',
                'email_address' => 'required|email|max:255',
                'bcc_address' => 'nullable|email|max:255',
                'official_company_number' => 'required|string|max:100',
                'GSTNo' => 'required|string|max:50',
                'home_currency_id' => 'required|exists:currencies,id',
                'fiscal_year_id' => 'required|exists:fiscal_years,id',
                'base_auto_price_calculation' => 'nullable|exists:sales_types,id',
                'new_company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'delete_company_logo' => 'boolean',
                'timezone_on_reports' => 'boolean',
                'company_logo_on_reports' => 'boolean',
                'use_barcodes_on_stocks' => 'boolean',
                'auto_increase_of_document_references' => 'boolean',
                'use_cost_centers_on_recurrent_invoices' => 'boolean',
                'use_long_descriptions_on_invoices' => 'boolean',
                'company_logo_on_views' => 'boolean',
                'tax_periods' => 'nullable|integer',
                'tax_last_period' => 'integer',
                'put_alternative_tax_include_on_docs' => 'boolean',
                'suppress_tax_rates_on_docs' => 'boolean',
                'automatic_revaluation_currency_accounts' => 'boolean',
                'add_price_from_std_cost' => 'numeric',
                'round_calculated_prices_to_nearest_cents' => 'integer',
                'manufacturing_enabled' => 'boolean',
                'fixed_assets_enabled' => 'boolean',
                'use_cost_centers' => 'boolean',
                'short_name_and_name_in_list' => 'boolean',
                'open_print_dialog_direct_on_reports' => 'boolean',
                'search_item_list' => 'boolean',
                'search_customer_list' => 'boolean',
                'search_supplier_list' => 'boolean',
                'login_timeout_seconds' => 'integer',
                'max_day_range_in_documents_days' => 'integer',
            ];
        }

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'name' => 'string|max:255',
                'address' => 'string',
                'domicile' => 'string|max:255',
                'phone_number' => 'string|max:50',
                'fax_number' => 'nullable|string|max:50',
                'email_address' => 'email|max:255',
                'bcc_address' => 'nullable|email|max:255',
                'official_company_number' => 'string|max:100',
                'GSTNo' => 'string|max:50',
                'home_currency_id' => 'exists:currencies,id',
                'fiscal_year_id' => 'exists:fiscal_years,id',
                'base_auto_price_calculation' => 'nullable|exists:sales_types,id',
                'new_company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'delete_company_logo' => 'boolean',
                'timezone_on_reports' => 'boolean',
                'company_logo_on_reports' => 'boolean',
                'use_barcodes_on_stocks' => 'boolean',
                'auto_increase_of_document_references' => 'boolean',
                'use_cost_centers_on_recurrent_invoices' => 'boolean',
                'use_long_descriptions_on_invoices' => 'boolean',
                'company_logo_on_views' => 'boolean',
                'tax_periods' => 'nullable|integer',
                'tax_last_period' => 'integer',
                'put_alternative_tax_include_on_docs' => 'boolean',
                'suppress_tax_rates_on_docs' => 'boolean',
                'automatic_revaluation_currency_accounts' => 'boolean',
                'add_price_from_std_cost' => 'numeric',
                'round_calculated_prices_to_nearest_cents' => 'integer',
                'manufacturing_enabled' => 'boolean',
                'fixed_assets_enabled' => 'boolean',
                'use_cost_centers' => 'boolean',
                'short_name_and_name_in_list' => 'boolean',
                'open_print_dialog_direct_on_reports' => 'boolean',
                'search_item_list' => 'boolean',
                'search_customer_list' => 'boolean',
                'search_supplier_list' => 'boolean',
                'login_timeout_seconds' => 'integer',
                'max_day_range_in_documents_days' => 'integer',
            ];
        }

        return [];
    }
}
