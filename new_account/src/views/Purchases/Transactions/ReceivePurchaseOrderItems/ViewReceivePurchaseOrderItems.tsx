import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo } from "react";
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
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";

export default function ViewReceivePurchaseOrderItems() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    reference,
    deliveryDate,
    deliveryAddress,
    supplierId,
    deliverIntoLocation,
    suppliersReference,
    purchaseOrderRef,
    items = [],
    subtotal,
    totalAmount,
    orderComments,
  } = state || {};

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });

  const supplierName = useMemo(() => {
    const found = suppliers.find((s) => String(s.supplier_id) === String(supplierId));
    return found ? found.supp_name : "-";
  }, [suppliers, supplierId]);

  const deliverLocationName = useMemo(() => {
    const found = locations.find((l) => String(l.loc_code) === String(deliverIntoLocation));
    return found ? found.location_name : deliverIntoLocation;
  }, [locations, deliverIntoLocation]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Receive Purchase Order" },
  ];

  return (
    <FormPageLayout>
      <Box sx={{ padding: 2, boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title={`Receive Purchase Order - ${reference || "-"}`} />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "var(--pallet-dark-blue)" }}>Receive Purchase Order</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><Typography><b>Reference:</b> {reference || "-"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Delivery Date:</b> {deliveryDate || "-"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Supplier:</b> {supplierName}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Delivery Into Location:</b> {deliverLocationName}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Supplier’s Reference:</b> {suppliersReference || "-"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>For Purchase Order:</b> {purchaseOrderRef || "-"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Delivery Address:</b> {deliveryAddress || "-"}</Typography></Grid>
          <Grid item xs={12} sm={6}><Typography><b>Order Comments:</b> {orderComments || "-"}</Typography></Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>Line Details</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Item Code</TableCell>
                <TableCell>Item Description</TableCell>
                <TableCell>Required By</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Line Total</TableCell>
                <TableCell>Quantity Invoiced</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8}>No items found</TableCell></TableRow>
              ) : (
                items.map((it: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{it.itemCode || "-"}</TableCell>
                    <TableCell>{it.description || "-"}</TableCell>
                    <TableCell>{it.requiredBy || "-"}</TableCell>
                    <TableCell>{it.quantity || "-"}</TableCell>
                    <TableCell>{it.unit || "-"}</TableCell>
                    <TableCell>{it.price || "-"}</TableCell>
                    <TableCell>{it.lineTotal || "-"}</TableCell>
                    <TableCell>{it.quantityInvoiced || "-"}</TableCell>
                  </TableRow>
                ))
              )}

              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell><b>Subtotal</b></TableCell>
                <TableCell>{subtotal || "-"}</TableCell>
                <TableCell></TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{totalAmount || "-"}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pr: 2 }}>
        <Button variant="contained" color="primary">Print</Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>Close</Button>
      </Stack>
    </FormPageLayout>
  );
}
