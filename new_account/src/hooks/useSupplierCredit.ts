import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupplierCreditSummary } from "../api/Supplier/SupplierCreditApi";
import { buildClientSupplierCreditSummary } from "../utils/supplierCredit";

export function useSupplierCredit(
  supplierId: string | number | null | undefined,
  suppliers?: any[]
) {
  const supplier = useMemo(() => {
    if (!supplierId || !suppliers?.length) {
      return null;
    }
    return (
      suppliers.find(
        (s) =>
          String(s.supplier_id ?? s.id ?? s.supp_id ?? "") ===
          String(supplierId)
      ) ?? null
    );
  }, [supplierId, suppliers]);

  const { data: apiSummary, isFetching } = useQuery({
    queryKey: ["supplierCreditSummary", supplierId],
    queryFn: () => getSupplierCreditSummary(supplierId!),
    enabled: supplierId != null && supplierId !== "",
    staleTime: 15_000,
  });

  const summary = useMemo(() => {
    if (apiSummary) {
      return apiSummary;
    }
    if (!supplier) {
      return null;
    }
    return buildClientSupplierCreditSummary(supplier, 0);
  }, [apiSummary, supplier]);

  return { supplier, summary, isLoading: isFetching };
}
