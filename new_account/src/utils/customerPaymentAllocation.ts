import { debtorTransNetTotal } from "./customerCredit";

export interface CustomerPaymentAllocationRow {
  transactionType: string;
  number: number;
  ref: string;
  date: string;
  dueDate: string;
  amount: number;
  otherAllocations: number;
  leftToAllocate: number;
  thisAllocation: number;
  transType: number;
  all: string;
  none: string;
}

/** Open sales invoice for this order — payment should target the invoice, not prep on the order. */
export function orderHasOpenInvoice(
  orderNo: number | string,
  debtorTrans: any[]
): boolean {
  return (debtorTrans || []).some((dt) => {
    if (Number(dt.trans_type) !== 10) return false;
    if (String(dt.order_no ?? "") !== String(orderNo)) return false;
    const left = debtorTransNetTotal(dt) - Number(dt.alloc ?? 0);
    return left > 0.001;
  });
}

/** Prepaid/cash sales order row — only before invoice is issued with an open balance. */
export function isAllocatablePrepaidSalesOrder(
  so: any,
  customerId: string | number,
  debtorTrans: any[]
): boolean {
  if (Number(so.trans_type) !== 30) return false;
  if (String(so.debtor_no) !== String(customerId)) return false;

  const prep = Number(so.prep_amount ?? 0);
  if (prep <= 0.001) return false;

  const left = prep - Number(so.alloc ?? 0);
  if (left <= 0.001) return false;

  const orderNo = so.order_no ?? so.orderNo;
  if (orderHasOpenInvoice(orderNo, debtorTrans)) return false;

  return true;
}

export function buildCustomerPaymentAllocationRows(
  customerId: string | number,
  salesOrders: any[],
  debtorTrans: any[],
  depositDate: string
): CustomerPaymentAllocationRow[] {
  const rows: CustomerPaymentAllocationRow[] = [];

  for (const so of salesOrders || []) {
    if (!isAllocatablePrepaidSalesOrder(so, customerId, debtorTrans)) {
      continue;
    }
    rows.push({
      transactionType: "Sales Order",
      number: Number(so.order_no ?? so.orderNo ?? 0),
      ref: so.reference || "",
      date: so.ord_date || depositDate,
      dueDate: so.delivery_date || so.ord_date || depositDate,
      amount: Number(so.prep_amount || 0),
      otherAllocations: Number(so.alloc || 0),
      leftToAllocate: Number(so.prep_amount || 0) - Number(so.alloc || 0),
      thisAllocation: 0,
      transType: 30,
      all: "All",
      none: "None",
    });
  }

  for (const dt of debtorTrans || []) {
    if (Number(dt.trans_type) !== 10) continue;
    if (String(dt.debtor_no) !== String(customerId)) continue;

    const total = debtorTransNetTotal(dt);
    const left = total - Number(dt.alloc ?? 0);
    if (left <= 0.001) continue;

    rows.push({
      transactionType: "Sales Invoice",
      number: Number(dt.trans_no),
      ref: dt.reference || "",
      date: dt.tran_date || depositDate,
      dueDate: dt.due_date || dt.tran_date || depositDate,
      amount: total,
      otherAllocations: Number(dt.alloc ?? 0),
      leftToAllocate: left,
      thisAllocation: 0,
      transType: 10,
      all: "All",
      none: "None",
    });
  }

  return rows;
}
