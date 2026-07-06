import { useQuery } from "@tanstack/react-query";
import { getNextFiscalYearReference } from "../api/FiscalYear/activeFiscalYearApi";

interface UseNextFiscalYearReferenceOptions {
  enabled?: boolean;
  asOfDate?: string;
}

export function useNextFiscalYearReference(
  transType: number,
  options: UseNextFiscalYearReferenceOptions = {}
) {
  const { enabled = true, asOfDate } = options;

  const query = useQuery({
    queryKey: ["nextFiscalYearReference", transType, asOfDate ?? null],
    queryFn: () => getNextFiscalYearReference(transType, asOfDate),
    enabled: enabled && Number.isFinite(transType),
    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    reference: query.data?.reference ?? "",
    suffix: query.data?.suffix ?? "",
    fiscalYearId: query.data?.fiscal_year_id ?? null,
    autoIncreaseEnabled: query.data?.auto_increase_of_document_references !== false,
    manualEntryRequired: query.data?.manual_entry_required === true,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
