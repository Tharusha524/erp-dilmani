import type { DashboardAlert } from "../api/Dashboard/DashboardApi";

const ALERT_ROUTES: Record<string, string> = {
  reorder_level: "/itemsandinventory/inquiriesandreports/inventory-item-status",
  overdue_receivables: "/sales/inquiriesandreports/customer-transaction-inquiry",
  open_purchase_orders: "/purchase/inquiriesandreports/purchase-orders-inquiry",
  fiscal_year: "/setup/companysetup/fiscal-years",
  gl_imbalance: "/bankingandgeneralledger/inquiriesandreports/gl-inquiry",
};

export function getDashboardAlertRoute(alert: DashboardAlert): string | null {
  if (alert.type && ALERT_ROUTES[alert.type]) {
    return ALERT_ROUTES[alert.type];
  }

  const label = alert.label.toLowerCase();
  if (label.includes("reorder")) return ALERT_ROUTES.reorder_level;
  if (label.includes("overdue customer")) return ALERT_ROUTES.overdue_receivables;
  if (label.includes("purchase order")) return ALERT_ROUTES.open_purchase_orders;
  if (label.includes("fiscal year")) return ALERT_ROUTES.fiscal_year;
  if (label.includes("gl out of balance")) return ALERT_ROUTES.gl_imbalance;

  return null;
}
