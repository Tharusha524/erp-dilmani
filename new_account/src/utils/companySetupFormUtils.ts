import type { ChangeEvent } from "react";

/** Company Setup checkbox fields (must match backend `company_setup` booleans). */
export const COMPANY_SETUP_BOOLEAN_FIELDS = [
  "delete_company_logo",
  "timezone_on_reports",
  "company_logo_on_reports",
  "use_barcodes_on_stocks",
  "auto_increase_of_document_references",
  "use_dimensions_on_recurrent_invoices",
  "use_long_descriptions_on_invoices",
  "company_logo_on_views",
  "put_alternative_tax_include_on_docs",
  "suppress_tax_rates_on_docs",
  "automatic_revaluation_currency_accounts",
  "manufacturing_enabled",
  "fixed_assets_enabled",
  "use_dimensions",
  "short_name_and_name_in_list",
  "open_print_dialog_direct_on_reports",
  "search_item_list",
  "search_customer_list",
  "search_supplier_list",
] as const;

export type CompanySetupBooleanField = (typeof COMPANY_SETUP_BOOLEAN_FIELDS)[number];

export function toCompanyBoolean(value: unknown): boolean {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return true;
  }
  if (value === false || value === 0 || value === "0" || value === "false") {
    return false;
  }
  return Boolean(value);
}

export function normalizeCompanySetupFromApi<T extends object>(company: T): T {
  const normalized = { ...company } as T & Record<CompanySetupBooleanField, boolean>;
  const source = company as Record<string, unknown>;

  for (const field of COMPANY_SETUP_BOOLEAN_FIELDS) {
    (normalized as Record<string, unknown>)[field] = toCompanyBoolean(source[field]);
  }

  return normalized;
}

const SKIP_FORM_KEYS = new Set(["databaseSchemeVersion"]);

export function appendCompanySetupFormData(
  formDataToSend: FormData,
  formData: object
): void {
  const formObject = formData as Record<string, unknown>;
  for (const key of Object.keys(formObject)) {
    if (SKIP_FORM_KEYS.has(key)) {
      continue;
    }

    const value = formObject[key];
    if (value === null || value === undefined) {
      continue;
    }

    if ((COMPANY_SETUP_BOOLEAN_FIELDS as readonly string[]).includes(key)) {
      formDataToSend.append(key, toCompanyBoolean(value) ? "1" : "0");
      continue;
    }

    if (value instanceof File) {
      formDataToSend.append(key, value);
      continue;
    }

    if (value === "") {
      continue;
    }

    formDataToSend.append(key, String(value));
  }

  // Always send every boolean (unchecked must persist as 0)
  for (const field of COMPANY_SETUP_BOOLEAN_FIELDS) {
    if (!formDataToSend.has(field)) {
      formDataToSend.append(field, "0");
    }
  }
}

export function handleCompanySetupInputChange<T extends object>(
  prev: T,
  event: ChangeEvent<HTMLInputElement>
): T {
  const { name, type, value, checked, files } = event.target;
  if (!name) {
    return prev;
  }

  if (type === "checkbox") {
    return { ...prev, [name]: checked };
  }

  if (type === "file") {
    return { ...prev, [name]: files?.[0] ?? null };
  }

  return { ...prev, [name]: value };
}
