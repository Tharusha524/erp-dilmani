import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo, useState, useEffect } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getShippingCompanies } from "../../../../api/ShippingCompany/ShippingCompanyApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getDebtorTransDetails } from "../../../../api/DebtorTrans/DebtorTransDetailsApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getTaxGroupItemsByGroupId } from "../../../../api/Tax/TaxGroupItemApi";
import { getTaxTypes } from "../../../../api/Tax/taxServices";

export default function ViewFinalInvoice() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    chargeTo,
    chargeBranch,
    paymentTerms,
    reference,
    customerOrderRef,
    dueDate,
    currency,
    shippingCompany,
    deliveries,
    ourOrderNo,
    salesType,
    invoiceDate,
    items = [],
    payments = [],
    subtotal,
    totalInvoice,
  } = state || {};

  // === Fetch Data ===
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: shippingCompanies = [] } = useQuery({
    queryKey: ["shippingCompanies"],
    queryFn: getShippingCompanies,
  });

  const { data: debtorTrans = [] } = useQuery({
    queryKey: ["debtorTrans"],
    queryFn: getDebtorTrans,
  });

  // === Resolve Names ===
  const debtorTransEntry = useMemo(() => {
    if (!reference) return null;
    return (debtorTrans || []).find(
      (dt: any) => dt.trans_type === 10 && String(dt.reference) === String(reference)
    );
  }, [debtorTrans, reference]);

  const debtorNo = useMemo(() => debtorTransEntry ? debtorTransEntry.debtor_no : chargeTo || "-", [debtorTransEntry, chargeTo]);
  const chargeBranchValue = useMemo(() => debtorTransEntry ? debtorTransEntry.branch_code : chargeBranch || "-", [debtorTransEntry, chargeBranch]);

  const { data: customerBranches = [] } = useQuery({
    queryKey: ["customerBranches", debtorNo],
    queryFn: () => getBranches(debtorNo),
    enabled: !!debtorNo && debtorNo !== "-",
  });

  const { data: paymentTermsData = [] } = useQuery({
    queryKey: ["paymentTerms"],
    queryFn: getPaymentTerms,
  });

  const { data: salesTypes = [] } = useQuery({
    queryKey: ["salesTypes"],
    queryFn: getSalesTypes,
  });

  const { data: debtorTransDetails = [] } = useQuery({
    queryKey: ["debtorTransDetails"],
    queryFn: getDebtorTransDetails,
  });

  const { data: stockMasters = [] } = useQuery({
    queryKey: ["stockMasters"],
    queryFn: getItems,
  });

  const { data: itemUnits = [] } = useQuery({
    queryKey: ["itemUnits"],
    queryFn: getItemUnits,
  });

  const { data: taxTypes = [] } = useQuery({
    queryKey: ["taxTypes"],
    queryFn: getTaxTypes,
  });

  const [taxGroupItems, setTaxGroupItems] = useState<any[]>([]);

  // Fetch tax group items when branch is available
  useEffect(() => {
    if (chargeBranchValue) {
      const selectedBranch = customerBranches.find((b: any) => b.branch_code === chargeBranchValue);
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
  }, [chargeBranchValue, customerBranches]);

  const chargeBranchName = useMemo(() => {
    if (!chargeBranchValue || chargeBranchValue === "-") return "-";
    const found = (customerBranches || []).find(
      (cb: any) => String(cb.branch_code) === String(chargeBranchValue)
    );
    if (found) {
      const address = found.br_address ? ` - ${found.br_address}` : '';
      return `${found.br_name}${address}`;
    }
    return chargeBranchValue;
  }, [customerBranches, chargeBranchValue]);

  const paymentTermsValue = useMemo(() => {
    if (!debtorTransEntry) return paymentTerms || "-";
    const ptId = debtorTransEntry.payment_terms;
    if (!ptId) return paymentTerms || "-";
    const found = (paymentTermsData || []).find(
      (pt: any) => String(pt.terms_indicator) === String(ptId)
    );
    return found ? found.description : ptId;
  }, [debtorTransEntry, paymentTerms, paymentTermsData]);

  const salesTypeValue = useMemo(() => {
    if (!debtorTransEntry) return salesType || "-";
    const tpe = debtorTransEntry.tpe;
    if (!tpe) return salesType || "-";
    const found = (salesTypes || []).find(
      (st: any) => String(st.id) === String(tpe)
    );
    return found ? found.typeName : tpe;
  }, [debtorTransEntry, salesType, salesTypes]);

  // Determine if prices include tax
  const selectedPriceList = useMemo(() => {
    return salesTypes.find((pl: any) => String(pl.id) === String(debtorTransEntry?.tpe));
  }, [salesTypes, debtorTransEntry]);

  const deliveriesValue = useMemo(() => {
    if (!debtorTransEntry) return deliveries || "-";
    const deliveryEntry = (debtorTrans || []).find(
      (dt: any) => dt.order_no === debtorTransEntry.order_no && dt.trans_type === 13
    );
    return deliveryEntry ? deliveryEntry.trans_no : deliveries || "-";
  }, [debtorTrans, debtorTransEntry, deliveries]);

  const itemDetails = useMemo(() => {
    if (!debtorTransEntry) return items;
    return (debtorTransDetails || []).filter(
      (dtd: any) => dtd.debtor_trans_no === debtorTransEntry.trans_no && dtd.debtor_trans_type === 10
    );
  }, [debtorTransDetails, debtorTransEntry, items]);

  const resolvedItemDetails = useMemo(() => {
    return itemDetails.map((it: any) => {
      const stock = (stockMasters || []).find((sm: any) => sm.stock_id === it.stock_id);
      const unitId = stock ? stock.units : null;
      const unit = (itemUnits || []).find((iu: any) => iu.id === unitId);
      const calculatedTotal = (it.quantity * it.unit_price * (1 - (it.discount_percent || 0) / 100)).toFixed(2);
      return {
        ...it,
        unitAbbr: unit ? unit.abbr : it.unit || "-",
        total: it.total || calculatedTotal,
      };
    });
  }, [itemDetails, stockMasters, itemUnits]);

  const calculatedSubtotal = useMemo(() => {
    return resolvedItemDetails.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0).toFixed(2);
  }, [resolvedItemDetails]);

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
        taxAmount = parseFloat(calculatedSubtotal) - (parseFloat(calculatedSubtotal) / (1 + taxRate / 100));
      } else {
        // For prices that don't include tax, calculate tax on subtotal
        // Tax amount = subtotal * (rate/100)
        taxAmount = parseFloat(calculatedSubtotal) * (taxRate / 100);
      }

      return {
        name: taxName,
        rate: taxRate,
        amount: taxAmount,
      };
    });
  }, [selectedPriceList, taxGroupItems, taxTypes, calculatedSubtotal]);

  const totalTaxAmount = taxCalculations.reduce((sum, tax) => sum + tax.amount, 0);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (selectedPriceList?.taxIncl) {
      return calculatedSubtotal;
    } else {
      return (parseFloat(calculatedSubtotal) + totalTaxAmount).toFixed(2);
    }
  }, [selectedPriceList, calculatedSubtotal, totalTaxAmount]);

  const chargeToName = useMemo(() => {
    if (!debtorNo || debtorNo === "-") return "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(debtorNo)
    );
    if (found) {
      const address = found.address ? ` - ${found.address}` : '';
      return `${found.name}${address}`;
    }
    return debtorNo;
  }, [customers, debtorNo]);

  const currencyValue = useMemo(() => {
    if (!debtorNo || debtorNo === "-") return currency || "-";
    const found = (customers || []).find(
      (c: any) => String(c.debtor_no) === String(debtorNo)
    );
    return found ? found.curr_code : currency || "-";
  }, [customers, debtorNo, currency]);

  const shippingCompanyName = useMemo(() => {
    const shipVia = debtorTransEntry ? debtorTransEntry.ship_via : shippingCompany || "-";
    if (!shipVia || shipVia === "-") return "-";
    const found = (shippingCompanies || []).find(
      (s: any) => String(s.shipper_id) === String(shipVia)
    );
    return found ? found.shipper_name : shipVia;
  }, [shippingCompanies, debtorTransEntry, shippingCompany]);

  const resolvedPayments = useMemo(() => {
    if (!debtorTransEntry) return payments;
    return (debtorTrans || []).filter((dt: any) => dt.trans_type === 10 && dt.order_no === debtorTransEntry.order_no).map((dt: any) => ({
      type: 'Invoice',
      number: dt.trans_no,
      date: dt.tran_date,
      totalAmount: dt.ov_amount,
      leftToAllocate: dt.ov_amount - dt.alloc,
      thisAllocation: dt.alloc,
    }));
  }, [debtorTrans, debtorTransEntry, payments]);

  // === Breadcrumbs ===
  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Final Invoices" },
  ];

  return (
    <FormPageLayout>
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title={`FINAL INVOICE - ${debtorTransEntry ? debtorTransEntry.trans_no : reference || "-"}`} />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>
      {/* Invoice Info */}
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 600, color: "var(--pallet-dark-blue)" }}
        >
          FINAL INVOICE #{debtorTransEntry.trans_no}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Charge To:</b> {chargeToName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Charge Branch:</b> {chargeBranchName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Payment Terms:</b> {paymentTermsValue}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Reference:</b> {reference || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Customer Order Ref:</b> {customerOrderRef || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Due Date:</b> {debtorTransEntry ? debtorTransEntry.due_date : dueDate || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Currency:</b> {currencyValue}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Shipping Company:</b> {shippingCompanyName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Our Order No:</b> {debtorTransEntry ? debtorTransEntry.order_no : ourOrderNo || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Sales Type:</b> {salesTypeValue}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Invoice Date:</b> {debtorTransEntry ? debtorTransEntry.tran_date : invoiceDate || "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      {/* Items Table */}
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>Item Details</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Item Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Discount %</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolvedItemDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No items available</TableCell>
                </TableRow>
              ) : (
                resolvedItemDetails.map((it: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{it.stock_id ?? "-"}</TableCell>
                    <TableCell>{it.description ?? "-"}</TableCell>
                    <TableCell>{it.quantity ?? "-"}</TableCell>
                    <TableCell>{it.unitAbbr}</TableCell>
                    <TableCell>{it.unit_price ?? "-"}</TableCell>
                    <TableCell>{it.discount_percent ?? "-"}</TableCell>
                    <TableCell>{it.total ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}

              {/* Totals */}
              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>{calculatedSubtotal}</TableCell>
              </TableRow>

              {/* Show tax breakdown */}
              {taxCalculations.length > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ fontWeight: 600, fontStyle: 'italic', color: 'text.secondary' }}>
                      {selectedPriceList?.taxIncl ? "Taxes Included:" : "Taxes:"}
                    </TableCell>
                  </TableRow>
                  {taxCalculations.map((tax, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={5}></TableCell>
                      <TableCell sx={{ pl: 4 }}>
                        {tax.name} ({tax.rate}%)
                      </TableCell>
                      <TableCell>{tax.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>TOTAL INVOICE</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {totalAmount}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>PREPAYMENT AMOUNT INVOICED</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {totalAmount}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Payments Table */}
      <Paper sx={{ p: 2 }}>
        {/* Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button variant="contained" color="primary">
            Print
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Close
          </Button>
        </Stack>
      </Paper>
    </FormPageLayout>
  );
}
