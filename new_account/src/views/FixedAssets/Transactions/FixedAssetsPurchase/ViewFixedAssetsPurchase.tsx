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

export default function ViewFixedAssetsPurchase() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    supplier,
    reference,
    supplierRef,
    invoiceDate,
    dueDate,
    location: locCode,
    items = [],
    subtotal,
    totalInvoice,
    trans_no,
    trans_type,
  } = state || {};

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const supplierName = useMemo(() => {
    if (!supplier) return "-";
    const found = (suppliers || []).find(
      (s: { supplier_id?: number; id?: number; supp_name?: string }) =>
        String(s.supplier_id ?? s.id) === String(supplier)
    );
    return found ? found.supp_name : supplier;
  }, [suppliers, supplier]);

  const breadcrumbItems = [
    { title: "Fixed Assets", href: "/fixedassets/transactions" },
    { title: "Fixed Asset Purchase" },
  ];

  return (
    <Stack spacing={2}>
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
          <PageTitle title={`Fixed Asset Purchase — ${reference || "-"}`} />
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

      <Paper sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 600, color: "var(--pallet-dark-blue)" }}
        >
          FIXED ASSET SUPPLIER INVOICE # {reference || "-"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Supplier:</b> {supplierName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Reference:</b> {reference || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Supplier&apos;s Reference:</b> {supplierRef || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Receive Location:</b> {locCode || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Invoice Date:</b> {invoiceDate || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <b>Due Date:</b> {dueDate || "-"}
            </Typography>
          </Grid>
          {trans_no ? (
            <Grid item xs={12} sm={6}>
              <Typography>
                <b>Transaction:</b> type {trans_type ?? 20} / #{trans_no}
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          Fixed Asset Items on this Invoice
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Line Value</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No items available</TableCell>
                </TableRow>
              ) : (
                items.map((row: {
                  item?: string;
                  description?: string;
                  quantity?: number;
                  price?: number;
                  lineValue?: number;
                }, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{row.item ?? "-"}</TableCell>
                    <TableCell>{row.description ?? "-"}</TableCell>
                    <TableCell align="right">{row.quantity ?? "-"}</TableCell>
                    <TableCell align="right">
                      {row.price != null ? Number(row.price).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell align="right">
                      {row.lineValue != null ? Number(row.lineValue).toFixed(2) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Box sx={{ width: 260 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography>Subtotal:</Typography>
              <Typography>
                {subtotal != null ? Number(subtotal).toFixed(2) : "-"}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ fontWeight: 600 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Total Invoice:</Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {totalInvoice != null ? Number(totalInvoice).toFixed(2) : "-"}
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate("/fixedassets/transactions/gl-journal-entries", {
                state: {
                  reference,
                  date: invoiceDate,
                  trans_type: trans_type ?? 20,
                  trans_no,
                },
              })
            }
          >
            View GL Journal Entries
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Close
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
