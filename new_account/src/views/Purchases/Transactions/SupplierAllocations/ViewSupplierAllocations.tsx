import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Typography,
  TextField,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getSupplierAllocationsInquiry } from "../../../../api/Purchases/PurchasesApi";
import {
  getSupplierAllocationOpen,
  processSupplierAllocations,
  AllocationTargetRow,
} from "../../../../api/Allocation/AllocationApi";
import FormattedNumberField from "../../../../components/FormattedNumberField";

type RowState = AllocationTargetRow & { this_allocation: number };

export default function ViewSupplierAllocations() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { transNo, transType } = state || {};
  const typeLabel =
    Number(transType) === 21 ? "Supplier Credit Note" : "Supplier Payment";
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<RowState[]>([]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["supplier-allocation-open", transNo, transType],
    queryFn: () => getSupplierAllocationOpen(Number(transNo), Number(transType)),
    enabled: Boolean(transNo && transType),
  });

  useEffect(() => {
    if (data?.targets) {
      setRows(data.targets.map((t) => ({ ...t, this_allocation: 0 })));
    }
  }, [data]);

  const from = data?.from as Record<string, any> | undefined;
  const supplierId = from?.supplier_id;
  const supplier = suppliers.find(
    (s: { supplier_id: number }) =>
      String(s.supplier_id) === String(supplierId)
  );
  const supplierName = supplier?.supp_name || `Supplier #${supplierId ?? "?"}`;
  const leftOnFrom = Number(from?.left_to_allocate ?? 0);

  const { data: openInvoices = [] } = useQuery({
    queryKey: ["supplier-open-invoices-for-alloc", supplierId],
    queryFn: () =>
      getSupplierAllocationsInquiry({
        supplier_id: Number(supplierId),
        trans_type: 20,
        settled: "no",
        limit: 500,
      }),
    enabled: Boolean(supplierId && !isLoading && rows.length === 0),
  });

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["supplier-all-invoices-for-alloc", supplierId],
    queryFn: () =>
      getSupplierAllocationsInquiry({
        supplier_id: Number(supplierId),
        trans_type: 20,
        limit: 500,
      }),
    enabled: Boolean(supplierId && !isLoading && rows.length === 0),
  });

  const noTargetsReason = useMemo(() => {
    if (rows.length > 0 || isLoading) return null;
    if (leftOnFrom <= 0.001) {
      return {
        severity: "success" as const,
        title: "This payment or credit note is already fully allocated.",
        detail:
          "There is nothing left to allocate. Return to the list or enable Show Settled Items to review it.",
      };
    }
    const openCount = Array.isArray(openInvoices) ? openInvoices.length : 0;
    const totalInvoices = Array.isArray(allInvoices) ? allInvoices.length : 0;
    if (openCount === 0 && totalInvoices === 0) {
      return {
        severity: "info" as const,
        title: `No supplier invoices exist for ${supplierName} yet.`,
        detail: `Payments and credit notes can only be allocated to supplier invoices for the same supplier. Create a supplier invoice for ${supplierName}, then return here and click Refresh.`,
      };
    }
    if (openCount === 0 && totalInvoices > 0) {
      return {
        severity: "info" as const,
        title: `All ${totalInvoices} supplier invoice(s) for ${supplierName} are already fully paid.`,
        detail: `This ${typeLabel.toLowerCase()} still has ${leftOnFrom.toFixed(2)} left to allocate. Post a new supplier invoice for ${supplierName} (direct or from GRN), then click Refresh to allocate against it.`,
      };
    }
    return {
      severity: "warning" as const,
      title: "No matching invoices are available to allocate right now.",
      detail: `Open invoices must belong to ${supplierName} and have a balance left. Click Refresh after posting or receiving invoices.`,
    };
  }, [
    rows.length,
    isLoading,
    leftOnFrom,
    openInvoices,
    allInvoices,
    supplierName,
    typeLabel,
  ]);

  const totalAllocation = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.this_allocation) || 0), 0),
    [rows]
  );

  const leftOnPayment = useMemo(() => {
    const fromLeft = Number(from?.left_to_allocate ?? 0);
    return Math.max(0, fromLeft - totalAllocation);
  }, [from, totalAllocation]);

  const processMutation = useMutation({
    mutationFn: processSupplierAllocations,
    onSuccess: (res) => {
      enqueueSnackbar(res?.message ?? "Allocations saved.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["suppTrans"] });
      queryClient.invalidateQueries({ queryKey: ["supplierAllocationInquiry"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-allocation-open", transNo, transType] });
      navigate("/purchase/transactions/allocate-supplier-payments-credit-notes");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(
        err?.response?.data?.message ?? "Failed to process allocations.",
        { variant: "error" }
      );
    },
  });

  const setAlloc = (index: number, value: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, this_allocation: value } : r))
    );
  };

  const handleAll = (index: number) => {
    const row = rows[index];
    const max = Math.min(row.left_to_allocate, leftOnPayment + (row.this_allocation || 0));
    setAlloc(index, max);
  };

  const handleNone = (index: number) => setAlloc(index, 0);

  const handleProcess = () => {
    const lines = rows
      .filter((r) => Number(r.this_allocation) > 0)
      .map((r) => ({
        trans_no_to: r.trans_no,
        trans_type_to: r.trans_type,
        amt: Number(r.this_allocation),
      }));

    if (lines.length === 0) {
      enqueueSnackbar("Enter at least one allocation amount.", { variant: "warning" });
      return;
    }

    processMutation.mutate({
      trans_no_from: Number(transNo),
      trans_type_from: Number(transType),
      date_alloc: new Date().toISOString().slice(0, 10),
      lines,
    });
  };

  if (!transNo || !transType) {
    return (
      <Typography>
        Missing transaction. Open from Supplier Allocations and click Allocate.
      </Typography>
    );
  }

  const showCreateInvoiceActions =
    !isLoading &&
    rows.length === 0 &&
    leftOnFrom > 0.001 &&
    noTargetsReason?.severity !== "success";

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="Allocate Supplier Payment or Credit Note" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Purchases", href: "/purchase" },
              { title: "Supplier Allocations" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Type:</b> {typeLabel}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Supplier:</b> {supplierName}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Reference:</b> {from?.reference || "-"} &nbsp; <b>Date:</b>{" "}
              {from?.trans_date || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Left to allocate:</b> {Number(from?.left_to_allocate ?? 0).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      {noTargetsReason ? (
        <Alert severity={noTargetsReason.severity}>
          <Typography variant="body2" sx={{ mb: showCreateInvoiceActions ? 1 : 0 }}>
            <strong>{noTargetsReason.title}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: showCreateInvoiceActions ? 2 : 0 }}>
            {noTargetsReason.detail}
          </Typography>
          {showCreateInvoiceActions ? (
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                onClick={() =>
                  navigate("/purchase/transactions/direct-supplier-invoice", {
                    state: {
                      supplierId: from?.supplier_id,
                      supplier: from?.supplier_id,
                      returnToAllocation: {
                        transNo: Number(transNo),
                        transType: Number(transType),
                      },
                    },
                  })
                }
              >
                Enter Direct Supplier Invoice
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  navigate("/purchase/transactions/supplier-invoice", {
                    state: {
                      supplierId: from?.supplier_id,
                      supplier: from?.supplier_id,
                      returnToAllocation: {
                        transNo: Number(transNo),
                        transType: Number(transType),
                      },
                    },
                  })
                }
              >
                Enter Supplier Invoice (from GRN)
              </Button>
            </Stack>
          ) : null}
        </Alert>
      ) : null}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Ref</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Other Alloc.</TableCell>
              <TableCell align="right">Left</TableCell>
              <TableCell>This Allocation</TableCell>
              <TableCell>All</TableCell>
              <TableCell>None</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11}>Loading open invoices…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography sx={{ py: 2 }} color="text.secondary">
                    {noTargetsReason?.title ??
                      "No unpaid supplier invoices for this supplier."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => (
                <TableRow key={`${r.trans_type}-${r.trans_no}`}>
                  <TableCell>{r.type_name}</TableCell>
                  <TableCell>{r.trans_no}</TableCell>
                  <TableCell>{r.reference || r.supp_reference}</TableCell>
                  <TableCell>{r.trans_date}</TableCell>
                  <TableCell>{r.due_date}</TableCell>
                  <TableCell align="right">{r.amount.toFixed(2)}</TableCell>
                  <TableCell align="right">{r.other_allocations.toFixed(2)}</TableCell>
                  <TableCell align="right">{r.left_to_allocate.toFixed(2)}</TableCell>
                  <TableCell>
                    <FormattedNumberField
                      size="small"
                      value={r.this_allocation || ""}
                      onChange={(e) => setAlloc(idx, Number(e.target.value) || 0)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleAll(idx)}>
                      All
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleNone(idx)}>
                      None
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell colSpan={8} align="right">
                <b>Total allocation:</b>
              </TableCell>
              <TableCell colSpan={3}>
                <b>{totalAllocation.toFixed(2)}</b>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={8} align="right">
                <b>Left on payment/credit:</b>
              </TableCell>
              <TableCell colSpan={3}>
                <b>{leftOnPayment.toFixed(2)}</b>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="contained" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleProcess}
          disabled={processMutation.isPending || rows.length === 0}
        >
          Process
        </Button>
        <Button
          variant="outlined"
          onClick={() =>
            navigate("/purchase/transactions/allocate-supplier-payments-credit-notes")
          }
        >
          Back to list
        </Button>
      </Stack>
    </FormPageLayout>
  );
}
