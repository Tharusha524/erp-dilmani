import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompanies } from "../api/CompanySetup/CompanySetupApi";
import { getCurrencies, type Currency } from "../api/Currency/currencyApi";

export interface HomeCurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  isLoading: boolean;
}

function resolveHomeCurrency(
  company: Record<string, unknown> | undefined,
  currencies: Currency[] | undefined
): Pick<HomeCurrencyInfo, "code" | "symbol" | "name"> {
  const nested =
    (company?.homeCurrency as Currency | undefined) ??
    (company?.home_currency as Currency | undefined);

  let currency = nested;
  if (!currency && company?.home_currency_id && currencies?.length) {
    currency = currencies.find(
      (c) => String(c.id) === String(company.home_currency_id)
    );
  }

  const code = (currency?.currency_abbreviation || "USD").toUpperCase();
  const symbol = currency?.currency_symbol || code;
  const name = currency?.currency_name || code;

  return { code, symbol, name };
}

export function formatWithCurrency(
  value: number,
  code: string,
  symbol: string,
  maximumFractionDigits = 0
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits,
    }).format(value);
  } catch {
    const formatted = value.toLocaleString("en-US", { maximumFractionDigits });
    return symbol.length === 1 ? `${symbol}${formatted}` : `${symbol} ${formatted}`;
  }
}

/** Home currency from Company Setup (admin configuration). */
export function useHomeCurrency() {
  const { data: companies, isLoading: companyLoading } = useQuery({
    queryKey: ["company"],
    queryFn: getCompanies,
    staleTime: 5 * 60 * 1000,
  });

  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    staleTime: 5 * 60 * 1000,
  });

  const company = Array.isArray(companies) ? companies[0] : undefined;

  const { code, symbol, name } = useMemo(
    () => resolveHomeCurrency(company as Record<string, unknown> | undefined, currencies),
    [company, currencies]
  );

  const formatCurrency = useCallback(
    (value: number, maximumFractionDigits = 0) =>
      formatWithCurrency(value, code, symbol, maximumFractionDigits),
    [code, symbol]
  );

  return {
    code,
    symbol,
    name,
    formatCurrency,
    isLoading: companyLoading || currenciesLoading,
  };
}
