import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerCreditSummary } from "../api/Customer/CustomerCreditApi";
import {
  buildClientCreditSummary,
  computeOutstandingFromDebtorTrans,
} from "../utils/customerCredit";

export function useCustomerCredit(
  debtorNo: string | number | null | undefined,
  customers: any[],
  debtorTrans?: any[]
) {
  const customer = useMemo(
    () =>
      (customers || []).find((c) => String(c.debtor_no) === String(debtorNo)) ??
      null,
    [customers, debtorNo]
  );

  const clientOutstanding = useMemo(() => {
    if (!debtorNo || !debtorTrans?.length) {
      return null;
    }
    return computeOutstandingFromDebtorTrans(debtorTrans, debtorNo);
  }, [debtorNo, debtorTrans]);

  const { data: apiSummary, isFetching } = useQuery({
    queryKey: ["customerCreditSummary", debtorNo],
    queryFn: () => getCustomerCreditSummary(debtorNo!),
    enabled: debtorNo != null && debtorNo !== "",
    staleTime: 15_000,
  });

  const summary = useMemo(() => {
    if (apiSummary) {
      return apiSummary;
    }
    if (!customer) {
      return null;
    }
    return buildClientCreditSummary(customer, clientOutstanding ?? 0);
  }, [apiSummary, customer, clientOutstanding]);

  return { customer, summary, isLoading: isFetching };
}
