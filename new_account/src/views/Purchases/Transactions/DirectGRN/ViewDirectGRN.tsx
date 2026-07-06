import React, { useMemo } from "react";
import { Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import {
  invalidatePurchasingQueries,
  voidPurchasingDocument,
} from "../../../../utils/voidPurchasingDocument";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import {
  DOCUMENT_PRINT_TYPES,
  PURCHASE_ORDER_PRINT_COLUMNS,
} from "../../../../utils/transactionPrintColumns";
import { buildGrnPrintLines } from "../../../../utils/transactionPrintHelpers";
import { formatPrintDate } from "../../../../utils/formatPrintDocument";

export default function ViewDirectGRN() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    reference,
    deliveryDate,
    deliveryAddress,
    supplierId,
    deliverIntoLocation,
    suppliersReference,
    purchaseOrderRef,
    grnBatchId,
    trans_no: transNo,
    items = [],
    subtotal,
    totalAmount,
    autoPrint = false,
  } = state || {};
  const batchId = grnBatchId ?? transNo;

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  const supplierName = useMemo(() => {
    const found = suppliers.find((s) => String(s.supplier_id) === String(supplierId));
    return found ? found.supp_name : "—";
  }, [suppliers, supplierId]);

  const supplierCurrency = useMemo(() => {
    const found = suppliers.find((s) => String(s.supplier_id) === String(supplierId));
    return found?.curr_code || undefined;
  }, [suppliers, supplierId]);

  const deliverLocationName = useMemo(() => {
    const found = locations.find(
      (l) => String(l.loc_code) === String(deliverIntoLocation)
    );
    return found ? found.location_name : deliverIntoLocation;
  }, [locations, deliverIntoLocation]);

  const printLines = useMemo(() => buildGrnPrintLines(items), [items]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Goods Received" },
  ];

  return (
    <TransactionPrintPage
      pageTitle={`Goods Received - ${reference || "—"}`}
      breadcrumbs={breadcrumbItems}
      onBack={() => navigate(-1)}
      autoPrint={autoPrint}
      ready={items.length > 0 || Boolean(reference)}
      extraActions={
        batchId ? (
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (!window.confirm(`Void GRN #${batchId}?`)) return;
              const memo = window.prompt("Void reason (optional):") ?? undefined;
              const result = await voidPurchasingDocument(
                25,
                Number(batchId),
                memo || undefined
              );
              if (result.ok === false) {
                alert(result.message);
                return;
              }
              await invalidatePurchasingQueries(queryClient);
              navigate(-1);
            }}
          >
            Void GRN
          </Button>
        ) : undefined
      }
      printContent={
        <TransactionPrintTemplate
          documentType={DOCUMENT_PRINT_TYPES.grn}
          documentNumber={batchId}
          reference={reference}
          documentDate={deliveryDate}
          currency={supplierCurrency}
          partyLabel="Supplier"
          partyName={supplierName}
          partyLines={[deliveryAddress].filter(Boolean) as string[]}
          documentFields={[
            { label: "Supplier's Ref", value: suppliersReference || "—" },
            { label: "Purchase Order", value: purchaseOrderRef || "—" },
            { label: "Received Into", value: deliverLocationName || "—" },
            { label: "Receipt Date", value: formatPrintDate(deliveryDate) },
          ]}
          columns={PURCHASE_ORDER_PRINT_COLUMNS}
          lines={printLines}
          totals={{
            subtotal: Number(subtotal) || undefined,
            total: Number(totalAmount ?? subtotal) || 0,
            currency: supplierCurrency,
          }}
          footerNote="Goods received note — retain for inventory and accounts payable matching."
        />
      }
    />
  );
}
