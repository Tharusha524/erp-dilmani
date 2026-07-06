import React, { useMemo } from "react";
import { Paper, Typography, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getShippingCompanies } from "../../../../api/ShippingCompany/ShippingCompanyApi";
import { getDebtorTransDetails } from "../../../../api/DebtorTrans/DebtorTransDetailsApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { useCustomerCredit } from "../../../../hooks/useCustomerCredit";
import CustomerCreditSummaryFields from "../../../../components/CustomerCreditSummaryFields";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import { formatPrintDate } from "../../../../utils/formatPrintDocument";
import {
  DOCUMENT_PRINT_TYPES,
  PACKING_SLIP_PRINT_COLUMNS,
  STANDARD_ITEM_PRINT_COLUMNS,
} from "../../../../utils/transactionPrintColumns";
import { buildDebtorDetailPrintLines } from "../../../../utils/transactionPrintHelpers";
import { deliveryGlNavState } from "../../../../utils/salesGlJournalNavState";

export default function ViewCustomerDelivery() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    chargeTo,
    chargeBranch,
    deliveredTo,
    reference,
    customerOrderRef,
    dispatchDate,
    currency,
    shippingCompany,
    dueDate,
    orderNo: ourOrderNo,
    saleType,
    items = [],
    subtotal,
    totalAmount,
    transNo: trans_no,
    printMode,
    autoPrint: autoPrintFlag,
  } = state || {};

  // Fetch customers for display
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  // Fetch branches for display
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  // Fetch sales types for display
  const { data: salesTypes = [] } = useQuery({
    queryKey: ["salesTypes"],
    queryFn: getSalesTypes,
  });

  // Fetch shipping companies for display
  const { data: shippingCompanies = [] } = useQuery({
    queryKey: ["shippingCompanies"],
    queryFn: getShippingCompanies,
  });

  // Fetch locations for display
  const { data: locations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  // Fetch items for units
  const { data: stockItems = [] } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  // Fetch item units for abbr
  const { data: itemUnits = [] } = useQuery({
    queryKey: ["itemUnits"],
    queryFn: getItemUnits,
  });

  // Fetch debtor trans for due_date
  const { data: debtorTransList = [] } = useQuery({
    queryKey: ["debtorTrans"],
    queryFn: getDebtorTrans,
  });

  const debtorTrans = debtorTransList.find((trans: any) => String(trans.trans_no) === String(trans_no) && trans.trans_type === 13);

  // Fetch debtor trans details for items
  const { data: debtorTransDetails = [] } = useQuery({
    queryKey: ["debtorTransDetails", trans_no],
    queryFn: () =>
      getDebtorTransDetails().then((details) =>
        details.filter(
          (d: any) =>
            String(d.debtor_trans_no) === String(trans_no) &&
            Number(d.debtor_trans_type) === 13
        )
      ),
    enabled: !!trans_no,
  });

  // Resolve display names
  const chargeToName = useMemo(() => {
    const debtorNo = debtorTrans?.debtor_no || chargeTo;
    if (!debtorNo) return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(debtorNo)
    );
    return found ? found.name : debtorNo;
  }, [customers, chargeTo, debtorTrans]);

  const customerAddress = useMemo(() => {
    const debtorNo = debtorTrans?.debtor_no || chargeTo;
    if (!debtorNo) return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(debtorNo)
    );
    return found ? found.address || "-" : "-";
  }, [customers, chargeTo, debtorTrans]);

  const currencyFromCustomer = useMemo(() => {
    const debtorNo = debtorTrans?.debtor_no || chargeTo;
    if (!debtorNo) return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(debtorNo)
    );
    return found ? found.curr_code || "-" : "-";
  }, [customers, chargeTo, debtorTrans]);

  const chargeBranchName = useMemo(() => {
    const branchCode = debtorTrans?.branch_code || chargeBranch;
    if (!branchCode) return "-";
    const found = (branches || []).find(
      (b: any) => String(b.branch_code) === String(branchCode)
    );
    if (found) {
      return `${found.br_name} - ${found.br_address || ""}`;
    }
    return branchCode;
  }, [branches, chargeBranch, debtorTrans]);

  const deliveredToName = useMemo(() => {
    if (!deliveredTo) return "-";
    const found = (locations || []).find(
      (l: any) => String(l.loc_code) === String(deliveredTo)
    );
    return found ? found.location_name : deliveredTo;
  }, [locations, deliveredTo]);

  const saleTypeName = useMemo(() => {
    const tpe = debtorTrans?.tpe || saleType;
    if (!tpe) return "-";
    const found = (salesTypes || []).find(
      (s: any) => String(s.id) === String(tpe)
    );
    return found ? found.typeName : tpe;
  }, [salesTypes, saleType, debtorTrans]);

  const shippingCompanyName = useMemo(() => {
    const shipVia = debtorTrans?.ship_via || shippingCompany;
    if (!shipVia) return "-";
    const found = (shippingCompanies || []).find(
      (s: any) => String(s.shipper_id) === String(shipVia)
    );
    return found ? found.shipper_name : shipVia;
  }, [shippingCompanies, shippingCompany, debtorTrans]);

  // Items from debtor trans details
  const itemsFromDetails = useMemo(() => {
    return (debtorTransDetails || []).map((detail: any) => {
      const itemFound = (stockItems || []).find((item: any) => String(item.stock_id) === String(detail.stock_id));
      const unitFound = (itemUnits || []).find((unit: any) => String(unit.id) === String(itemFound?.units));
      return {
        itemCode: detail.stock_id,
        description: detail.description,
        quantity: detail.quantity,
        unit: unitFound?.abbr || "-",
        price: detail.unit_price,
        discount: detail.discount_percent || 0,
        total: (detail.quantity || 0) * (detail.unit_price || 0) * (1 - (detail.discount_percent || 0) / 100),
      };
    });
  }, [debtorTransDetails, stockItems, itemUnits]);

  // Calculate totals from details
  const subtotalFromDetails = useMemo(() => {
    return itemsFromDetails.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [itemsFromDetails]);

  const totalAmountFromDetails = useMemo(() => {
    if (debtorTrans) {
      return (
        Number(debtorTrans.ov_amount ?? 0) +
        Number(debtorTrans.ov_gst ?? 0) +
        Number(debtorTrans.ov_freight ?? 0) +
        Number(debtorTrans.ov_discount ?? 0)
      );
    }
    return subtotalFromDetails;
  }, [debtorTrans, subtotalFromDetails]);

  const resolvedDebtorNo = debtorTrans?.debtor_no ?? chargeTo ?? null;
  const documentTotal = Number(totalAmountFromDetails || totalAmount || 0);

  const { summary: creditSummary, isLoading: creditLoading } = useCustomerCredit(
    resolvedDebtorNo,
    customers
  );

  const isPackingSlip = printMode === "packing";
  const autoPrint = Boolean(autoPrintFlag) || printMode === "delivery" || printMode === "packing";

  const printLines = useMemo(
    () =>
      buildDebtorDetailPrintLines(
        debtorTransDetails,
        stockItems,
        itemUnits,
        !isPackingSlip
      ),
    [debtorTransDetails, stockItems, itemUnits, isPackingSlip]
  );

  const taxLines = useMemo(() => {
    const lines = [];
    if (Number(debtorTrans?.ov_freight) > 0) {
      lines.push({ label: "Shipping", amount: Number(debtorTrans.ov_freight) });
    }
    if (Number(debtorTrans?.ov_gst) > 0) {
      lines.push({ label: "Tax", amount: Number(debtorTrans.ov_gst) });
    }
    return lines;
  }, [debtorTrans]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Customer Deliveries" },
  ];

  return (
    <TransactionPrintPage
      pageTitle={
        isPackingSlip
          ? `Packing Slip #${trans_no || "—"}`
          : `Delivery Note #${trans_no || "—"}`
      }
      breadcrumbs={breadcrumbItems}
      onBack={() => navigate(-1)}
      autoPrint={autoPrint}
      ready={Boolean(trans_no || debtorTrans)}
      extraActions={
        <Button
          variant="outlined"
          onClick={() =>
            navigate("/sales/transactions/gl-journal-entries", {
              state: deliveryGlNavState({
                ...(state as Record<string, unknown>),
                trans_no: trans_no ?? debtorTrans?.trans_no,
                trans_type: 13,
              }),
            })
          }
        >
          View GL Journal Entries
        </Button>
      }
      printContent={
        <TransactionPrintTemplate
          documentType={
            isPackingSlip ? "Packing Slip" : DOCUMENT_PRINT_TYPES.deliveryNote
          }
          documentNumber={trans_no}
          reference={reference}
          documentDate={debtorTrans?.tran_date || dispatchDate}
          dueDate={debtorTrans?.due_date || dueDate}
          currency={currencyFromCustomer !== "-" ? currencyFromCustomer : undefined}
          partyName={chargeToName}
          partyLines={[customerAddress !== "-" ? customerAddress : ""].filter(Boolean)}
          documentFields={[
            { label: "Deliver To", value: chargeBranchName },
            { label: "Customer Ref", value: customerOrderRef || "—" },
            { label: "Shipping", value: shippingCompanyName },
            { label: "Sale Type", value: saleTypeName },
            { label: "Our Order No", value: ourOrderNo || "—" },
            {
              label: "Dispatch Date",
              value: formatPrintDate(debtorTrans?.tran_date || dispatchDate),
            },
          ]}
          columns={
            isPackingSlip ? PACKING_SLIP_PRINT_COLUMNS : STANDARD_ITEM_PRINT_COLUMNS
          }
          lines={printLines}
          totals={
            isPackingSlip
              ? {
                  total: subtotalFromDetails || 0,
                  currency:
                    currencyFromCustomer !== "-" ? currencyFromCustomer : undefined,
                }
              : {
                  subtotal: subtotalFromDetails,
                  taxLines,
                  total: totalAmountFromDetails || Number(totalAmount) || 0,
                  currency:
                    currencyFromCustomer !== "-" ? currencyFromCustomer : undefined,
                }
          }
          footerNote={
            isPackingSlip
              ? "Packing slip — verify quantities before dispatch."
              : "Delivery note — goods dispatched as listed above."
          }
        />
      }
      screenExtras={
        <Paper sx={{ p: 2, maxWidth: 360 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Customer Credit
          </Typography>
          <CustomerCreditSummaryFields
            summary={creditSummary}
            documentTotal={documentTotal}
            isLoading={creditLoading}
          />
        </Paper>
      }
    />
  );
}
