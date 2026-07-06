import { useQuery } from "@tanstack/react-query";
import {
  getCompanySetupSettings,
  type CompanySetupFlags,
} from "../api/CompanySetup/companySetupSettingsApi";

const defaultFlags: CompanySetupFlags = {
  delete_company_logo: false,
  timezone_on_reports: false,
  company_logo_on_reports: false,
  use_barcodes_on_stocks: false,
  auto_increase_of_document_references: true,
  use_dimensions_on_recurrent_invoices: false,
  use_long_descriptions_on_invoices: false,
  company_logo_on_views: false,
  put_alternative_tax_include_on_docs: false,
  suppress_tax_rates_on_docs: false,
  automatic_revaluation_currency_accounts: false,
  manufacturing_enabled: false,
  fixed_assets_enabled: false,
  use_dimensions: false,
  short_name_and_name_in_list: false,
  open_print_dialog_direct_on_reports: false,
  search_item_list: false,
  search_customer_list: false,
  search_supplier_list: false,
};

/** Company Setup flags and metadata from GET /api/company-setup/settings */
export function useCompanySetupSettings() {
  const query = useQuery({
    queryKey: ["company-setup-settings"],
    queryFn: getCompanySetupSettings,
    staleTime: 5 * 60 * 1000,
  });

  const flags = query.data?.flags ?? defaultFlags;

  return {
    configured: query.data?.configured ?? false,
    flags,
    dimensionLevel: query.data?.dimension_level ?? (flags.use_dimensions ? 1 : 0),
    manufacturingEnabled: flags.manufacturing_enabled,
    fixedAssetsEnabled: flags.fixed_assets_enabled,
    useDimensions: flags.use_dimensions,
    autoIncreaseReferences: flags.auto_increase_of_document_references,
    suppressTaxRatesOnDocs: flags.suppress_tax_rates_on_docs,
    useLongDescriptionsOnInvoices: flags.use_long_descriptions_on_invoices,
    searchItemList: flags.search_item_list,
    searchCustomerList: flags.search_customer_list,
    searchSupplierList: flags.search_supplier_list,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
