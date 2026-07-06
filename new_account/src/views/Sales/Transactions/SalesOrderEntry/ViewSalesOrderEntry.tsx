import React, { useMemo, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getSalesOrderByOrderNo, getSalesOrders } from "../../../../api/SalesOrders/SalesOrdersApi";
import { getSalesOrderDetailsByOrderNo } from "../../../../api/SalesOrders/SalesOrderDetailsApi";
import { getTaxGroupItemsByGroupId } from "../../../../api/Tax/TaxGroupItemApi";
import { getTaxTypes } from "../../../../api/Tax/taxServices";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { useCustomerCredit } from "../../../../hooks/useCustomerCredit";
import CustomerCreditSummaryFields from "../../../../components/CustomerCreditSummaryFields";
import { TransactionPrintPage, TransactionPrintTemplate } from "../../../../components/Print";
import { formatPrintDate } from "../../../../utils/formatPrintDocument";
import {
  DOCUMENT_PRINT_TYPES,
  STANDARD_ITEM_PRINT_COLUMNS,
} from "../../../../utils/transactionPrintColumns";
import { buildSalesOrderPrintLines } from "../../../../utils/transactionPrintHelpers";

export default function ViewSalesOrderEntry() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { orderNo, autoPrint } = state || {};

  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxGroupItems, setTaxGroupItems] = useState<any[]>([]);

  // Fetch customers for display
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  // Fetch branches for tax group
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  // Fetch inventory locations for display
  const { data: locations = [] } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
  });

  // Fetch payment terms for display
  const { data: paymentTerms = [] } = useQuery({
    queryKey: ["paymentTerms"],
    queryFn: getPaymentTerms,
  });

  // Fetch price lists for tax inclusion check
  const { data: priceLists = [] } = useQuery({
    queryKey: ["priceLists"],
    queryFn: getSalesTypes,
  });

  // Fetch tax types for tax calculations
  const { data: taxTypes = [] } = useQuery({
    queryKey: ["taxTypes"],
    queryFn: getTaxTypes,
  });

  // Fetch items for unit lookup
  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  // Fetch item units for unit name lookup
  const { data: itemUnits = [] } = useQuery({
    queryKey: ["itemUnits"],
    queryFn: getItemUnits,
  });

  // Fetch all sales orders for deliveries
  const { data: allSalesOrders = [] } = useQuery({
    queryKey: ["allSalesOrders"],
    queryFn: getSalesOrders,
  });

  // Fetch debtor transactions for invoices
  const { data: debtorTrans = [] } = useQuery({
    queryKey: ["debtorTrans"],
    queryFn: getDebtorTrans,
  });

  // Fetch sales order and details from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!orderNo) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [orderData, detailsData] = await Promise.all([
          getSalesOrderByOrderNo(orderNo),
          getSalesOrderDetailsByOrderNo(orderNo),
        ]);
        setSalesOrder(orderData);
        setOrderDetails(detailsData || []);
      } catch (error) {
        console.error("Error fetching sales order data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderNo]);

  // Fetch tax group items when sales order is loaded
  useEffect(() => {
    if (salesOrder?.branch_code) {
      const selectedBranch = branches.find((b: any) => b.branch_code === salesOrder.branch_code);
      if (selectedBranch?.tax_group) {
        getTaxGroupItemsByGroupId(selectedBranch.tax_group)
          .then((items) => setTaxGroupItems(items))
          .catch((err) => {
            console.error("Failed to fetch tax group items:", err);
            setTaxGroupItems([]);
          });
      } else {
        setTaxGroupItems([]);
      }
    } else {
      setTaxGroupItems([]);
    }
  }, [salesOrder, branches]);

  // Resolve customer and location names
  const customerName = useMemo(() => {
    const customerId = salesOrder?.debtor_no;
    if (!customerId) return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(customerId)
    );
    return found ? found.name : "-";
  }, [customers, salesOrder]);

  const deliverFromName = useMemo(() => {
    const deliverFromLocation = salesOrder?.from_stk_loc;
    if (!deliverFromLocation) return "-";
    const found = (locations || []).find(
      (l: any) => String(l.loc_code) === String(deliverFromLocation)
    );
    return found ? found.location_name : deliverFromLocation;
  }, [locations, salesOrder]);

  const paymentTermName = useMemo(() => {
    const paymentTermId = salesOrder?.payment_terms;
    if (!paymentTermId) return "-";
    const found = (paymentTerms || []).find(
      (pt: any) => String(pt.terms_indicator) === String(paymentTermId)
    );
    return found ? found.description : "-";
  }, [paymentTerms, salesOrder]);

  // Resolve customer currency
  const customerCurrency = useMemo(() => {
    const customerId = salesOrder?.debtor_no;
    if (!customerId) return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(customerId)
    );
    return found ? found.curr_code || "-" : "-";
  }, [customers, salesOrder]);

  // Get totals from sales order
  const totalAmount = useMemo(() => {
    return salesOrder?.total ? parseFloat(salesOrder.total).toFixed(2) : "0.00";
  }, [salesOrder]);

  const documentTotal = Number(salesOrder?.total ?? 0);

  const { summary: creditSummary, isLoading: creditLoading } = useCustomerCredit(
    salesOrder?.debtor_no ?? null,
    customers
  );

  // Calculate subtotal from order details for display
  const subtotal = useMemo(() => {
    return orderDetails.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0) * (1 - parseFloat(item.discount_percent || 0) / 100)), 0).toFixed(2);
  }, [orderDetails]);

  // Determine if prices include tax
  const selectedPriceList = useMemo(() => {
    return priceLists.find((pl: any) => String(pl.id) === String(salesOrder?.order_type));
  }, [priceLists, salesOrder]);

  // Calculate taxes
  const taxCalculations = useMemo(() => {
    if (taxGroupItems.length === 0) {
      return [];
    }

    // Calculate tax amounts for each tax type
    return taxGroupItems.map((item: any) => {
      const taxTypeData = taxTypes.find((t: any) => t.id === item.tax_type_id);
      const taxRate = taxTypeData?.default_rate || 0;
      const taxName = taxTypeData?.description || "Tax";

      let taxAmount = 0;
      if (selectedPriceList?.taxIncl) {
        // For prices that include tax, we need to extract the tax amount
        // Tax amount = subtotal - (subtotal / (1 + rate/100))
        taxAmount = parseFloat(subtotal) - (parseFloat(subtotal) / (1 + taxRate / 100));
      } else {
        // For prices that don't include tax, calculate tax on subtotal
        // Tax amount = subtotal * (rate/100)
        taxAmount = parseFloat(subtotal) * (taxRate / 100);
      }

      return {
        name: taxName,
        rate: taxRate,
        amount: taxAmount,
      };
    });
  }, [selectedPriceList, taxGroupItems, taxTypes, subtotal]);

  const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);

  // Filter deliveries and invoices related to this order
  const deliveries = useMemo(() => {
    return allSalesOrders.filter((so: any) => so.trans_type == 13 && so.order_ == orderNo);
  }, [allSalesOrders, orderNo]);

  const invoices = useMemo(() => {
    return debtorTrans.filter((dt: any) => dt.type == 10 && dt.order_ == orderNo);
  }, [debtorTrans, orderNo]);

  const creditNotes = useMemo(() => {
    return debtorTrans.filter((dt: any) => dt.type == 11 && dt.order_ == orderNo);
  }, [debtorTrans, orderNo]);

  const printLines = useMemo(
    () => buildSalesOrderPrintLines(orderDetails, items, itemUnits),
    [orderDetails, items, itemUnits]
  );

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Sales Orders" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!salesOrder) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Sales order not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  return (
    <TransactionPrintPage
      pageTitle={`Sales Order #${orderNo}`}
      breadcrumbs={breadcrumbItems}
      onBack={() => navigate(-1)}
      autoPrint={autoPrint}
      ready={!loading && !!salesOrder}
      printContent={
        <TransactionPrintTemplate
          documentType={DOCUMENT_PRINT_TYPES.salesOrder}
          documentNumber={orderNo}
          reference={salesOrder?.reference}
          documentDate={salesOrder?.ord_date}
          dueDate={salesOrder?.delivery_date}
          currency={customerCurrency !== "-" ? customerCurrency : undefined}
          partyName={customerName}
          partyLines={[
            salesOrder?.deliver_to,
            salesOrder?.delivery_address,
          ].filter(Boolean) as string[]}
          partyFields={[
            { label: "Phone", value: salesOrder?.contact_phone || "—" },
            { label: "Email", value: salesOrder?.contact_email || "—" },
          ]}
          documentFields={[
            { label: "Customer Ref", value: salesOrder?.customer_ref || "—" },
            { label: "Payment Terms", value: paymentTermName },
            { label: "Deliver From", value: deliverFromName },
            { label: "Required By", value: formatPrintDate(salesOrder?.delivery_date) },
          ]}
          columns={STANDARD_ITEM_PRINT_COLUMNS}
          lines={printLines}
          totals={{
            subtotal: parseFloat(subtotal),
            taxLines: taxCalculations.map((t) => ({
              label: `${t.name} (${t.rate}%)`,
              amount: t.amount,
            })),
            taxIncluded: Boolean(selectedPriceList?.taxIncl),
            total: parseFloat(totalAmount),
            currency: customerCurrency !== "-" ? customerCurrency : undefined,
          }}
          comments={salesOrder?.comments}
          footerNote="This is a sales order confirmation. Delivery and invoicing will follow your agreed terms."
        />
      }
      screenExtras={
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Customer Credit
              </Typography>
              <CustomerCreditSummaryFields
                summary={creditSummary}
                documentTotal={documentTotal}
                isLoading={creditLoading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Deliveries
              </Typography>
              <RelatedDocTable
                rows={deliveries}
                emptyLabel="No deliveries"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Invoices / Credits
              </Typography>
              <RelatedDocTable rows={invoices} emptyLabel="No invoices" />
              <RelatedDocTable
                rows={creditNotes}
                emptyLabel="No credit notes"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </Paper>
      }
    />
  );
}

function RelatedDocTable({
  rows,
  emptyLabel,
  sx,
}: {
  rows: any[];
  emptyLabel: string;
  sx?: object;
}) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={sx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Ref</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>{emptyLabel}</TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.ref ?? row.reference ?? "—"}</TableCell>
                <TableCell>{row.date ?? row.tran_date ?? row.ord_date ?? "—"}</TableCell>
                <TableCell align="right">{row.total ?? row.ov_amount ?? "0.00"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
