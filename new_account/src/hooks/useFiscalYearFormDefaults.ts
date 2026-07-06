import { useQuery } from "@tanstack/react-query";
import {
  getActiveFiscalYear,
  type ActiveFiscalYearResponse,
} from "../api/FiscalYear/activeFiscalYearApi";

export interface FiscalYearDateDefaults {
  startDate: string;
  endDate: string;
  asAtDate: string;
  fiscalYearFrom: string;
  fiscalYearTo: string;
  label: string;
  fiscalYear: ActiveFiscalYearResponse | undefined;
  isLoading: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaults(data?: ActiveFiscalYearResponse): Omit<FiscalYearDateDefaults, "isLoading" | "fiscalYear"> {
  const today = todayIso();

  if (!data?.fiscal_year_from || !data?.fiscal_year_to) {
    return {
      startDate: today,
      endDate: today,
      asAtDate: today,
      fiscalYearFrom: today,
      fiscalYearTo: today,
      label: "Current period",
    };
  }

  const from = data.fiscal_year_from;
  const to = data.fiscal_year_to;
  const endDate =
    data.report_end ||
    (today >= from && today <= to ? today : today > to ? to : from);

  return {
    startDate: data.report_start || from,
    endDate,
    asAtDate: endDate,
    fiscalYearFrom: from,
    fiscalYearTo: to,
    label: data.label || `${from} to ${to}`,
  };
}

export function useFiscalYearFormDefaults(): FiscalYearDateDefaults {
  const { data, isLoading } = useQuery({
    queryKey: ["activeFiscalYear"],
    queryFn: getActiveFiscalYear,
    staleTime: 5 * 60 * 1000,
  });

  const defaults = buildDefaults(data);

  return {
    ...defaults,
    fiscalYear: data,
    isLoading,
  };
}

/** Apply fiscal-year defaults to report form fields when still empty. */
export function applyFiscalYearDateFields<T extends object>(
  current: T,
  defaults: Pick<FiscalYearDateDefaults, "startDate" | "endDate" | "asAtDate">,
  fields: {
    startDate?: keyof T;
    endDate?: keyof T;
    asAtDate?: keyof T;
    activitySince?: keyof T;
  }
): T {
  let next = { ...current };

  const apply = (key: keyof T | undefined, value: string) => {
    if (!key || !value) {
      return;
    }
    const currentValue = next[key];
    if (currentValue === "" || currentValue === undefined || currentValue === null) {
      next = { ...next, [key]: value };
    }
  };

  apply(fields.startDate, defaults.startDate);
  apply(fields.endDate, defaults.endDate);
  apply(fields.asAtDate, defaults.asAtDate);
  apply(fields.activitySince, defaults.startDate);

  return next;
}
