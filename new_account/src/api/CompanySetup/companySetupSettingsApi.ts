import api from "../apiClient";

export interface CompanySetupFlags {
  delete_company_logo: boolean;
  timezone_on_reports: boolean;
  company_logo_on_reports: boolean;
  use_barcodes_on_stocks: boolean;
  auto_increase_of_document_references: boolean;
  use_cost_centers_on_recurrent_invoices: boolean;
  use_long_descriptions_on_invoices: boolean;
  company_logo_on_views: boolean;
  put_alternative_tax_include_on_docs: boolean;
  suppress_tax_rates_on_docs: boolean;
  automatic_revaluation_currency_accounts: boolean;
  manufacturing_enabled: boolean;
  fixed_assets_enabled: boolean;
  use_cost_centers: boolean;
  short_name_and_name_in_list: boolean;
  open_print_dialog_direct_on_reports: boolean;
  search_item_list: boolean;
  search_customer_list: boolean;
  search_supplier_list: boolean;
}

export interface CompanySetupSettingsResponse {
  configured: boolean;
  id?: number;
  name?: string;
  home_currency_id?: number;
  home_currency?: {
    id: number;
    currency_abbreviation: string;
    currency_symbol: string;
    currency_name: string;
  } | null;
  fiscal_year_id?: number;
  flags: CompanySetupFlags;
  costCenter_level?: number;
}

export const getCompanySetupSettings = async (): Promise<CompanySetupSettingsResponse> => {
  const response = await api.get("/company-setup/settings");
  return response.data;
};
