<?php

namespace App\Support;

use App\Models\CompanySetup;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CompanySetupSettings
{
    public const REPORT_TIMEZONE = 'Asia/Colombo';

    public static function current(): ?CompanySetup
    {
        return CompanySetup::query()
            ->with(['homeCurrency', 'fiscalYear', 'basePriceCalculation'])
            ->orderBy('id')
            ->first();
    }

    public static function flag(string $attribute, bool $default = false): bool
    {
        $company = self::current();

        if (! $company || ! in_array($attribute, self::booleanFields(), true)) {
            return $default;
        }

        return (bool) $company->{$attribute};
    }

    /**
     * All boolean flags for API / frontend (Setup → Company Setup).
     *
     * @return array<string, bool>
     */
    public static function flags(): array
    {
        $company = self::current();
        $out = [];

        foreach (self::booleanFields() as $field) {
            $out[$field] = $company ? (bool) $company->{$field} : false;
        }

        return $out;
    }

    /**
     * Full company settings payload for clients and internal services.
     *
     * @return array<string, mixed>
     */
    public static function toApiPayload(): array
    {
        $company = self::current();

        if (! $company) {
            return [
                'configured' => false,
                'flags' => self::flags(),
                'dimension_level' => 0,
            ];
        }

        $homeCurrency = $company->homeCurrency;

        return [
            'configured' => true,
            'id' => $company->id,
            'name' => $company->name,
            'home_currency_id' => $company->home_currency_id,
            'home_currency' => $homeCurrency ? [
                'id' => $homeCurrency->id,
                'currency_abbreviation' => $homeCurrency->currency_abbreviation,
                'currency_symbol' => $homeCurrency->currency_symbol,
                'currency_name' => $homeCurrency->currency_name,
            ] : null,
            'fiscal_year_id' => $company->fiscal_year_id,
            'flags' => self::flags(),
            'dimension_level' => self::dimensionLevel(),
            'tax_periods' => $company->tax_periods,
            'tax_last_period' => $company->tax_last_period,
            'add_price_from_std_cost' => $company->add_price_from_std_cost,
            'round_calculated_prices_to_nearest_cents' => $company->round_calculated_prices_to_nearest_cents,
            'login_timeout_seconds' => $company->login_timeout_seconds,
            'max_day_range_in_documents_days' => $company->max_day_range_in_documents_days,
        ];
    }

    public static function autoIncreaseDocumentReferences(): bool
    {
        return self::flag('auto_increase_of_document_references', true);
    }

    public static function manufacturingEnabled(): bool
    {
        return self::flag('manufacturing_enabled', false);
    }

    public static function fixedAssetsEnabled(): bool
    {
        return self::flag('fixed_assets_enabled', false);
    }

    public static function dimensionsEnabled(): bool
    {
        return self::flag('use_dimensions', false);
    }

    /** FA use_dimension: 0=off, 1=dim1 only, 2=dim1+dim2 */
    public static function dimensionLevel(): int
    {
        if (! self::dimensionsEnabled()) {
            return 0;
        }

        if (Schema::hasTable('dimensions')
            && DB::table('dimensions')->where('type', 2)->exists()) {
            return 2;
        }

        return 1;
    }

    public static function useBarcodesOnStocks(): bool
    {
        return self::flag('use_barcodes_on_stocks', false);
    }

    public static function useLongDescriptionsOnInvoices(): bool
    {
        return self::flag('use_long_descriptions_on_invoices', false);
    }

    public static function companyLogoOnReports(): bool
    {
        return self::flag('company_logo_on_reports', false);
    }

    public static function suppressTaxRatesOnDocs(): bool
    {
        return self::flag('suppress_tax_rates_on_docs', false);
    }

    public static function reportTimezone(): string
    {
        return self::flag('timezone_on_reports', false)
            ? self::REPORT_TIMEZONE
            : (string) config('app.timezone', 'UTC');
    }

    public static function formatReportDateTime(?Carbon $date = null, string $format = 'd/m/Y H:i'): string
    {
        $date = ($date ?? now())->copy()->timezone(self::reportTimezone());

        return $date->format($format);
    }

    /**
     * Resolve a journal/transaction currency code against the currencies table.
     * Falls back to company home currency, then the first configured currency.
     */
    public static function resolveCurrency(?string $currency): string
    {
        $candidate = strtoupper(trim((string) ($currency ?? '')));

        if ($candidate !== '' && Schema::hasTable('currencies')) {
            $exists = DB::table('currencies')
                ->where('currency_abbreviation', $candidate)
                ->exists();
            if ($exists) {
                return $candidate;
            }
        }

        $home = self::current()?->homeCurrency?->currency_abbreviation;
        if ($home && Schema::hasTable('currencies')) {
            $home = strtoupper(trim((string) $home));
            $exists = DB::table('currencies')
                ->where('currency_abbreviation', $home)
                ->exists();
            if ($exists) {
                return $home;
            }
        }

        if (Schema::hasTable('currencies')) {
            $fallback = DB::table('currencies')->value('currency_abbreviation');
            if ($fallback) {
                return strtoupper((string) $fallback);
            }
        }

        throw new \InvalidArgumentException(
            'No currency is configured. Add at least one currency under Setup → Currencies and set the company home currency.'
        );
    }

    /**
     * @return list<string>
     */
    public static function booleanFields(): array
    {
        return [
            'delete_company_logo',
            'timezone_on_reports',
            'company_logo_on_reports',
            'use_barcodes_on_stocks',
            'auto_increase_of_document_references',
            'use_dimensions_on_recurrent_invoices',
            'use_long_descriptions_on_invoices',
            'company_logo_on_views',
            'put_alternative_tax_include_on_docs',
            'suppress_tax_rates_on_docs',
            'automatic_revaluation_currency_accounts',
            'manufacturing_enabled',
            'fixed_assets_enabled',
            'use_dimensions',
            'short_name_and_name_in_list',
            'open_print_dialog_direct_on_reports',
            'search_item_list',
            'search_customer_list',
            'search_supplier_list',
        ];
    }
}
