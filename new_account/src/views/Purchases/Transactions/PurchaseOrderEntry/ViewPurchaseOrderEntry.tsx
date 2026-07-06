import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPurchOrderByOrderNo } from "../../../../api/PurchOrders/PurchOrderApi";
import { getPurchOrderDetailsByOrderNo } from "../../../../api/PurchOrders/PurchOrderDetailsApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getSuppliers, getSupplierById } from "../../../../api/Supplier/SupplierApi";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import {
  DOCUMENT_PRINT_TYPES,
  PURCHASE_ORDER_PRINT_COLUMNS,
} from "../../../../utils/transactionPrintColumns";
import { buildPurchaseOrderPrintLines } from "../../../../utils/transactionPrintHelpers";
import { formatPrintDate } from "../../../../utils/formatPrintDocument";

export default function ViewPurchaseOrderEntry() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const initialState: any = state || {};
  const autoPrint = Boolean(initialState.autoPrint);

  const [order, setOrder] = React.useState<any>(initialState);
  const normalizeDetail = (d: any) => {
    const quantity = Number(d.quantity_ordered ?? d.quantity ?? d.qty ?? d.quantity_order ?? d.qty_ordered ?? 0);
    const price = Number(d.unit_price ?? d.price ?? d.act_price ?? d.std_cost_unit ?? 0);
    // Normalize possible date fields and format to YYYY-MM-DD when valid
    const rawDate = d.delivery_date ?? d.req_delivery_date ?? d.required_delivery_date ?? d.request_date ?? d.deliveryDate ?? null;
    let deliveryDate: string | null = null;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) deliveryDate = parsed.toISOString().split("T")[0];
    }
    const computed = Number(quantity * price);
    const lineTotalValue = d.line_total != null ? Number(d.line_total) : (isFinite(computed) ? computed : 0);

    return {
      // UI fields expected by the view
      itemCode: d.item_code ?? d.stock_id ?? d.stockId ?? d.itemCode ?? d.stock_code ?? "",
      description: d.description ?? d.item_description ?? d.itemDesc ?? "",
      quantity: quantity,
      unit: (() => {
        const extract = (v: any) => {
          if (v == null) return null;
          if (typeof v === "string" || typeof v === "number") return String(v);
          if (typeof v === "object") return String(v.abbr ?? v.abbreviation ?? v.code ?? v.name ?? v.unit ?? v.uom ?? "");
          return null;
        };

        // direct fields (could be primitive or object)
        const directCandidates = [d.unit, d.uom, d.abbr, d.unit_of_measure, d.item_unit, d.units, d.unit_code, d.uom_code, d.stock_uom, d.unit_name, d.unitName, d.unit_desc, d.raw_unit, d.uomCode, d.uom_code_alt];
        for (const c of directCandidates) {
          const out = extract(c);
          if (out) return out;
        }

        // nested common shapes
        const nestedCandidates = [d.item?.units, d.item?.uom, d.item?.unit_of_measure, d.item?.uom_code, d.item?.unit_name, d.stock?.unit, d.stock?.uom, d.stock?.unit_of_measure, d.stock_unit, d.item_master?.unit, d.item_master?.uom, d.inventory_item?.uom, d.inventory_item?.unit];
        for (const c of nestedCandidates) {
          const out = extract(c);
          if (out) return out;
        }

        return "";
      })(),
      deliveryDate: deliveryDate,
      price: price,
      // Per UI: 'Requested By' column should show the request/delivery date
      requestedBy: deliveryDate ?? (d.requested_by ?? d.requestedBy ?? d.req_by ?? ""),
      lineTotal: lineTotalValue,
      qtyReceived: Number(d.quantity_received ?? d.qty_received ?? d.qtyReceived ?? 0),
      qtyInvoiced: Number(d.qty_invoiced ?? d.qtyInvoiced ?? 0),
      raw: d,
    };
  };

  const [orderItems, setOrderItems] = React.useState<any[]>((initialState.items || []).map((it: any) => normalizeDetail(it)));

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  // Fetch items & units so we can resolve unit abbreviations similar to entry page
  const { data: allItems = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: allItemUnits = [] } = useQuery({ queryKey: ["itemUnits"], queryFn: getItemUnits });

  // Fetch inventory locations so we can display location_name instead of loc_code
  const { data: inventoryLocations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  // If navigation provided only an orderNo (from success page), fetch full order + details
  React.useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderNo = initialState?.orderNo ?? initialState?.order_no ?? initialState?.orderNo;
        if (!orderNo) return;

        // If items already provided, skip fetch
        if (Array.isArray(initialState.items) && initialState.items.length > 0) return;

        const fetched = await getPurchOrderByOrderNo(orderNo);
        if (fetched) setOrder(fetched);

        const details = await getPurchOrderDetailsByOrderNo(orderNo);
        if (Array.isArray(details)) setOrderItems(details.map((d: any) => normalizeDetail(d)));
      } catch (err) {
        console.error('Failed to fetch purchase order or details', err);
      }
    };

    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  // Supplier name resolve
  const resolveSupplierId = (s: any) => s?.supplier_id ?? s?.id ?? s?.supp_id ?? s?.supplier ?? s?.supplierId ?? s?.debtor_no ?? s?.code ?? s?.supp_code ?? null;

  const [supplierName, setSupplierName] = React.useState<string>("-");

  React.useEffect(() => {
    const loadName = async () => {
      const supplierId = order?.supplier ?? order?.supplier_id ?? order?.supplierId ?? initialState?.supplier;
      if (!supplierId) {
        setSupplierName("-");
        return;
      }

      // try to resolve from loaded suppliers list first
      const found = suppliers?.find((s) => String(resolveSupplierId(s)) === String(supplierId));
      if (found) {
        setSupplierName(found.supp_name ?? found.supp_short_name ?? found.name ?? String(resolveSupplierId(found)));
        return;
      }

      // fallback to API fetch by id
      try {
        const fetched = await getSupplierById(supplierId);
        if (fetched) {
          const name = fetched.supp_name ?? fetched.name ?? fetched.supp_short_name ?? fetched.supplier_name ?? String(resolveSupplierId(fetched) ?? supplierId);
          setSupplierName(name);
          return;
        }
      } catch (e) {
        // ignore
      }

      setSupplierName(String(supplierId));
    };
    loadName();
  }, [order, suppliers, initialState]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Purchase Order" },
  ];

  // derive display fields from loaded `order` or initial navigation state
  const reference = order?.reference ?? initialState?.reference ?? "-";
  const supplierRef = order?.requisition_no ?? initialState?.supplierRef ?? initialState?.supplier_ref ?? "-";
  const _orderDateRaw = order?.ord_date ?? initialState?.orderDate ?? initialState?.date ?? "-";
  const orderDate = React.useMemo(() => {
    if (!_orderDateRaw === null || _orderDateRaw === undefined) return "-";
    try {
      const parsed = new Date(_orderDateRaw as string);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    } catch (e) {
      // fallthrough
    }
    // if it's already a short date string or other format, return as-is
    return String(_orderDateRaw);
  }, [_orderDateRaw]);
  const deliveryAddress = order?.delivery_address ?? initialState?.deliveryAddress ?? "-";
  const deliverIntoLocation = order?.into_stock_location ?? initialState?.location ?? "-";
  const deliverIntoLocationName = React.useMemo(() => {
    const code = deliverIntoLocation;
    if (!code) return "-";
    const found = (inventoryLocations || []).find((l: any) => String(l.loc_code) === String(code) || String(l.id) === String(code));
    return found ? found.location_name ?? String(code) : String(code);
  }, [deliverIntoLocation, inventoryLocations]);
  const items = orderItems;
  const subTotal = items.reduce((s: number, r: any) => s + (Number(r.lineTotal ?? r.total ?? 0) || 0), 0);
  const amountTotal = subTotal;

  const supplierCurrency = React.useMemo(() => {
    const supplierId = order?.supplier ?? order?.supplier_id ?? initialState?.supplier;
    if (!supplierId) return undefined;
    const found = suppliers?.find((s) => String(resolveSupplierId(s)) === String(supplierId));
    return found?.curr_code || undefined;
  }, [order, suppliers, initialState]);

  const orderNo = order?.order_no ?? initialState?.orderNo ?? initialState?.order_no;

  // Helper to resolve unit display similar to PurchaseOrderEntry behaviour
  const getUnitForDetail = (row: any) => {
    if (!row) return "";
    if (row.unit) return String(row.unit);

    const extract = (v: any) => {
      if (v == null) return null;
      if (typeof v === "string" || typeof v === "number") return String(v);
      if (typeof v === "object") return String(v.abbr ?? v.abbreviation ?? v.code ?? v.name ?? v.unit ?? v.uom ?? "");
      return null;
    };

    // try raw nested values first
    const rawUnit = extract(row.raw?.unit ?? row.raw?.uom ?? row.raw?.unit_obj ?? row.raw?.unitObj ?? row.raw?.unitInfo);
    if (rawUnit) return rawUnit;

    // try to resolve via item -> units mapping
    const code = row.raw?.item_code ?? row.itemCode ?? row.raw?.stock_id ?? row.raw?.stockId;
    if (code && Array.isArray(allItems) && allItems.length > 0) {
      const foundItem = allItems.find((it: any) => String(it.stock_id) === String(code) || String(it.id) === String(code) || String(it.stockId) === String(code) || String(it.description) === String(row.description));
      if (foundItem) {
        const unitId = foundItem.units ?? foundItem.unit ?? foundItem.unit_id ?? foundItem.uom;
        if (unitId != null && Array.isArray(allItemUnits) && allItemUnits.length > 0) {
          const foundUnit = allItemUnits.find((u: any) => String(u.id) === String(unitId) || String(u.unit_id) === String(unitId));
          if (foundUnit) return String(foundUnit.abbr ?? foundUnit.abbreviation ?? foundUnit.code ?? foundUnit.name ?? unitId);
          return String(unitId);
        }
      }
    }

    return "";
  };

  const printLines = React.useMemo(
    () => buildPurchaseOrderPrintLines(items, getUnitForDetail),
    [items, allItems, allItemUnits]
  );

  return (
    <TransactionPrintPage
      pageTitle={`Purchase Order - ${reference || "—"}`}
      breadcrumbs={breadcrumbItems}
      onBack={() => navigate(-1)}
      autoPrint={autoPrint}
      ready={items.length > 0 || Boolean(reference)}
      printContent={
        <TransactionPrintTemplate
          documentType={DOCUMENT_PRINT_TYPES.purchaseOrder}
          documentNumber={orderNo}
          reference={reference}
          documentDate={orderDate}
          currency={supplierCurrency}
          partyLabel="Supplier"
          partyName={supplierName}
          partyLines={[deliveryAddress !== "-" ? deliveryAddress : ""].filter(Boolean)}
          documentFields={[
            { label: "Requisition", value: supplierRef || "—" },
            { label: "Deliver Into", value: deliverIntoLocationName || "—" },
            { label: "Order Date", value: formatPrintDate(orderDate) },
          ]}
          columns={PURCHASE_ORDER_PRINT_COLUMNS}
          lines={printLines}
          totals={{
            subtotal: subTotal,
            total: amountTotal,
            currency: supplierCurrency,
          }}
          footerNote="Please confirm quantities and delivery dates. Quote our reference on all correspondence."
        />
      }
    />
  );
}
