import type { NavigateFunction } from "react-router-dom";

/** Navigate to the appropriate sales document view with auto-print. */
export function navigateSalesInquiryPrint(
  navigate: NavigateFunction,
  transType: string | number,
  row: {
    number: string;
    reference?: string;
    date?: string;
    debtor_no?: string | number;
    order?: string;
  }
) {
  const t = String(transType);
  const transNo = row.number;

  if (t === "10") {
    navigate("/sales/transactions/direct-invoice/view-direct-invoice", {
      state: { transNo, reference: row.reference, autoPrint: true },
    });
    return;
  }
  if (t === "11") {
    navigate("/sales/transactions/customer-credit-notes/view-customer-credit-note", {
      state: { trans_no: transNo, reference: row.reference, date: row.date, autoPrint: true },
    });
    return;
  }
  if (t === "12") {
    navigate(
      `/sales/transactions/customer-payments/view-customer-payment?trans_no=${transNo}`,
      {
        state: { transNo, trans_type: 12, reference: row.reference, autoPrint: true },
      }
    );
    return;
  }
  if (t === "13") {
    navigate("/sales/transactions/direct-delivery/view-direct-delivery", {
      state: { trans_no: transNo, reference: row.reference, printMode: "delivery" },
    });
    return;
  }
  if (t === "32" || t === "30") {
    const path =
      t === "32"
        ? "/sales/transactions/sales-quotation-entry/view-sales-quotation"
        : "/sales/transactions/sales-order-entry/view-sales-order";
    navigate(path, { state: { orderNo: transNo, autoPrint: true } });
  }
}
