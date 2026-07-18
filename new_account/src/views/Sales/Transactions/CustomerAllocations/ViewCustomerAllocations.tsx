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
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import theme from "../../../../theme";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import {
  getCustomerAllocationOpen,
  processCustomerAllocations,
} from "../../../../api/Allocation/AllocationApi";
import { voidCustomerPayment } from "../../../../api/SalesPayment/SalesPaymentApi";
import { resolveTransactionCurrencyCode } from "../../../../utils/relationId";
import { useTransactionMoney } from "../../../../hooks/useTransactionMoney";
import {
  allocationLinesFromRows,
  autoAllocateCustomerRows,
  AllocationRowState,
} from "../../../../utils/customerAllocation";
import FormattedNumberField from "../../../../components/FormattedNumberField";

type RowState = AllocationRowState;

export default function ViewCustomerAllocations() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const stateBag = (state || {}) as {
    transNo?: number | string;
    transType?: number | string;
    customer?: string;
    reference?: string;
  };
  const transNo = stateBag.transNo ?? searchParams.get("transNo");
  const transType = stateBag.transType ?? searchParams.get("transType");
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<RowState[]>([]);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const transNoNum = Number(transNo);
  const transTypeNum = Number(transType);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["customer-allocation-open", transNoNum, transTypeNum],
    queryFn: () => getCustomerAllocationOpen(transNoNum, transTypeNum),
    enabled: Number.isFinite(transNoNum) && Number.isFinite(transTypeNum),
  });

  useEffect(() => {
    setRows([]);
  }, [transNoNum, transTypeNum]);

  useEffect(() => {
    if (data?.targets) {
      setRows(data.targets.map((t) => ({ ...t, this_allocation: 0 })));
    } else if (!isLoading && !isFetching && data) {
      setRows([]);
    }
  }, [data, transNoNum, transTypeNum, isLoading, isFetching]);

  const from = data?.from as Record<string, any> | undefined;
  const targetScope = (data as { target_scope?: string } | undefined)?.target_scope;
  const isCredit = transTypeNum === 11;
  const customer = customers.find(
    (c: { debtor_no: number }) => String(c.debtor_no) === String(from?.debtor_no)
  );
  const customerName = stateBag.customer || customer?.name || from?.debtor_no || "-";
  const customerCurrency = resolveTransactionCurrencyCode(customer);
  const { formatMoney } = useTransactionMoney(customerCurrency);

  const leftOnFrom = Number(from?.left_to_allocate ?? 0);

  const noTargetsReason = useMemo(() => {
    if (rows.length > 0 || isLoading || isFetching) return null;
    if (leftOnFrom <= 0.001) {
      return {
        severity: "success" as const,
        title: isCredit
          ? "This credit note is already fully allocated."
          : "This payment is already fully allocated.",
        detail: "Return to the list or enable Show Settled Items to review it.",
      };
    }
    return {
      severity: "warning" as const,
      title: `No open invoices or delivery notes for ${customerName}.`,
      detail:
        `This ${isCredit ? "credit note" : "payment"} still has ${formatMoney(leftOnFrom)} unallocated. ` +
        "All existing invoices are already settled, so there is nothing to allocate to. " +
        (isCredit
          ? "Post a new sales invoice or void this credit note if it was entered in error."
          : "If the payment amount was entered incorrectly, void this payment and re-enter the correct amount."),
    };
  }, [
    rows.length,
    isLoading,
    isFetching,
    leftOnFrom,
    customerName,
    isCredit,
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
    mutationFn: processCustomerAllocations,
    onSuccess: (res) => {
      enqueueSnackbar(res?.message ?? "Allocations saved.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["debtorTrans"] });
      queryClient.invalidateQueries({ queryKey: ["custAllocations"] });
      queryClient.invalidateQueries({ queryKey: ["customerAllocationInquiry"] });
      navigate("/sales/transactions/allocate-customer-payments-credit-notes");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(
        err?.response?.data?.message ?? "Failed to process allocations.",
        { variant: "error" }
      );
    },
  });

  const voidMutation = useMutation({
    mutationFn: (memo?: string) => voidCustomerPayment(transNoNum, memo),
    onSuccess: (res) => {
      setVoidDialogOpen(false);
      enqueueSnackbar(res?.message ?? "Customer payment voided.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["debtorTrans"] });
      queryClient.invalidateQueries({ queryKey: ["custAllocations"] });
      queryClient.invalidateQueries({ queryKey: ["customerAllocationInquiry"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["customerCreditSummary"] });
      navigate("/sales/transactions/allocate-customer-payments-credit-notes");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(
        err?.response?.data?.message ?? "Failed to void customer payment.",
        { variant: "error" }
      );
    },
  });

  const handleVoidPayment = () => {
    setVoidDialogOpen(true);
  };

  const handleConfirmVoidPayment = (memo?: string) => {
    voidMutation.mutate(memo);
  };

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

  const handleAutoAllocate = () => {
    const available = Number(from?.left_to_allocate ?? 0);
    if (available <= 0.001) {
      enqueueSnackbar("Nothing left to allocate on this payment/credit.", { variant: "warning" });
      return;
    }
    if (rows.length === 0) {
      enqueueSnackbar("No open invoices or delivery notes for this customer.", { variant: "warning" });
      return;
    }
    setRows(autoAllocateCustomerRows(rows, available));
  };

  const handleProcess = () => {
    const fromLeft = Number(from?.left_to_allocate ?? 0);
    let activeRows = rows;
    let lines = allocationLinesFromRows(activeRows);

    if (lines.length === 0 && activeRows.length > 0 && fromLeft > 0.001) {
      activeRows = autoAllocateCustomerRows(activeRows, fromLeft);
      lines = allocationLinesFromRows(activeRows);
      setRows(activeRows);
    }

    if (lines.length === 0) {
      if (activeRows.length === 0) {
        enqueueSnackbar(
          fromLeft > 0.001
            ? "This payment/credit has an unallocated balance but there are no open invoices or delivery notes for this customer."
            : "This payment/credit is already fully allocated.",
          { variant: "warning" }
        );
      } else {
        enqueueSnackbar("Enter at least one allocation amount, or use Auto Allocate.", {
          variant: "warning",
        });
      }
      return;
    }

    processMutation.mutate({
      trans_no_from: transNoNum,
      trans_type_from: transTypeNum,
      date_alloc: new Date().toISOString().slice(0, 10),
      lines,
    });
  };

  if (!Number.isFinite(transNoNum) || !Number.isFinite(transTypeNum)) {
    return <Typography>Missing transaction. Open from Customer Allocations list.</Typography>;
  }

  if (transTypeNum !== 11 && transTypeNum !== 12) {
    return (
      <Typography color="error">
        Transaction type {transTypeNum} cannot be allocated. Open a customer payment (12) or credit note (11) from the allocations list.
      </Typography>
    );
  }

  const loadErrorMessage =
    (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
      ?.message ??
    (error as { message?: string })?.message;

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title={isCredit ? "Allocate Customer Credit Note" : "Allocate Customer Payment"} />
          <Breadcrumb
            breadcrumbs={[
              { title: "Sales", href: "/sales/transactions" },
              { title: "Customer Allocations" },
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
              <b>Type:</b>{" "}
              {transTypeNum === 11 ? "Customer Credit Note" : "Customer Payment"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Transaction #:</b> {transNoNum} &nbsp; <b>Reference:</b>{" "}
              {from?.reference || stateBag.reference || "-"} &nbsp; <b>Date:</b>{" "}
              {from?.tran_date || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Customer:</b> {customerName} &nbsp; <b>Currency:</b> {customerCurrency}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center" }}>
              <b>Left to allocate on {isCredit ? "credit note" : "payment"}:</b>{" "}
              {formatMoney(leftOnFrom)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      {noTargetsReason ? (
        <Alert severity={noTargetsReason.severity}>
          <Typography variant="subtitle2">{noTargetsReason.title}</Typography>
          <Typography variant="body2">{noTargetsReason.detail}</Typography>
        </Alert>
      ) : null}
      {targetScope === "invoices_and_deliveries" && rows.length > 0 ? (
        <Alert severity="info">
          {isCredit ? "Credit notes" : "Payments"} can be allocated to open{" "}
          <b>sales invoices</b> and <b>delivery notes</b> that are not already covered by a paid invoice.
        </Alert>
      ) : null}
      <TableContainer component={Paper} sx={{ p: 1 }}>
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
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={11}>
                  Loading open invoices and delivery notes for this payment/credit…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography color="error">{loadErrorMessage || "Could not load allocation data."}</Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {noTargetsReason?.title ??
                    "No unpaid invoices or delivery notes for this customer."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => (
                <TableRow key={`${r.trans_type}-${r.trans_no}`} hover>
                  <TableCell>{r.type_name}</TableCell>
                  <TableCell>{r.trans_no}</TableCell>
                  <TableCell>{r.reference}</TableCell>
                  <TableCell>{r.tran_date}</TableCell>
                  <TableCell>{r.due_date}</TableCell>
                  <TableCell align="right">{formatMoney(r.amount)}</TableCell>
                  <TableCell align="right">{formatMoney(r.other_allocations)}</TableCell>
                  <TableCell align="right">{formatMoney(r.left_to_allocate)}</TableCell>
                  <TableCell>
                    <FormattedNumberField
                      size="small"
                      value={r.this_allocation || ""}
                      onChange={(e) => setAlloc(idx, Number(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
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
                <b>{formatMoney(totalAllocation)}</b>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={8} align="right">
                <b>Left on payment/credit:</b>
              </TableCell>
              <TableCell colSpan={3}>
                <b>{formatMoney(leftOnPayment)}</b>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {!isCredit && leftOnFrom > 0.001 && rows.length === 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleVoidPayment}
            disabled={voidMutation.isPending}
          >
            Void Payment
          </Button>
        )}
        <Button variant="contained" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAutoAllocate}
          disabled={rows.length === 0 || Number(from?.left_to_allocate ?? 0) <= 0.001}
        >
          Auto Allocate
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleProcess}
          disabled={processMutation.isPending}
        >
          Process
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/sales/transactions/allocate-customer-payments-credit-notes")}
        >
          Back to list
        </Button>
      </Stack>
      <ConfirmDialog
        open={voidDialogOpen}
        onClose={() => setVoidDialogOpen(false)}
        onConfirm={handleConfirmVoidPayment}
        title={`Void customer payment #${transNoNum}?`}
        message={
          "This will permanently remove the payment and reverse its bank and GL entries. " +
          "This action cannot be undone."
        }
        confirmLabel="Void payment"
        cancelLabel="Keep payment"
        severity="error"
        showReasonField
        reasonLabel="Void reason (optional)"
        reasonPlaceholder="e.g. Wrong amount entered"
        loading={voidMutation.isPending}
      />
    </FormPageLayout>
  );
}
