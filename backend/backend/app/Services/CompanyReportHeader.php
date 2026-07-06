<?php

namespace App\Services;

use App\Support\CompanySetupSettings;
use Illuminate\Support\Facades\Storage;

class CompanyReportHeader
{
    /**
     * Company branding block for PDF / print templates.
     *
     * @return array<string, mixed>
     */
    public static function forReports(): array
    {
        $company = CompanySetupSettings::current();

        if (!$company) {
            return [
                'show_logo' => false,
                'name' => config('app.name', 'Company'),
                'address' => '',
                'domicile' => '',
                'phone_number' => '',
                'fax_number' => '',
                'email_address' => '',
                'official_company_number' => '',
                'gst_no' => '',
                'logo_path' => null,
                'logo_url' => null,
            ];
        }

        $logoPath = null;
        $logoUrl = null;

        $showLogoOnReports = CompanySetupSettings::companyLogoOnReports();

        if ($showLogoOnReports && $company->new_company_logo) {
            $stored = $company->new_company_logo;
            if (Storage::disk('public')->exists($stored)) {
                $logoPath = Storage::disk('public')->path($stored);
                $logoUrl = asset('storage/' . $stored);
            }
        }

        return [
            'show_logo' => $showLogoOnReports && $logoPath !== null,
            'timezone_on_reports' => CompanySetupSettings::flag('timezone_on_reports'),
            'report_timezone' => CompanySetupSettings::reportTimezone(),
            'report_generated_at' => CompanySetupSettings::formatReportDateTime(),
            'suppress_tax_rates_on_docs' => CompanySetupSettings::suppressTaxRatesOnDocs(),
            'put_alternative_tax_include_on_docs' => CompanySetupSettings::flag('put_alternative_tax_include_on_docs'),
            'use_long_descriptions_on_invoices' => CompanySetupSettings::useLongDescriptionsOnInvoices(),
            'company_logo_on_views' => CompanySetupSettings::flag('company_logo_on_views'),
            'flags' => CompanySetupSettings::flags(),
            'name' => $company->name,
            'address' => $company->address,
            'domicile' => $company->domicile,
            'phone_number' => $company->phone_number,
            'fax_number' => $company->fax_number,
            'email_address' => $company->email_address,
            'official_company_number' => $company->official_company_number,
            'gst_no' => $company->GSTNo,
            'logo_path' => $logoPath,
            'logo_url' => $logoUrl,
        ];
    }
}
