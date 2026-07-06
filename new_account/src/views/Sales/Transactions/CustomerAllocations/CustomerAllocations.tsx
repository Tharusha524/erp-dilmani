import React, { useMemo, useState } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  FormControlLabel,
  TableFooter,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { useTransactionMoney } from "../../../../hooks/useTransactionMoney";
import { resolveTransactionCurrencyCode } from "../../../../utils/relationId";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import { getCustomerAllocationInquiry } from "../../../../api/SalesInquiry/SalesInquiryApi";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

function formatDate(val: unknown): string {
  if (!val) return "";
  const s = String(val);
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
}

type AllocationRow = {
  id: string;
  type: string;
  transType: number;
  transNo: number | string;
  number: string;
  reference: string;
  date: string;
  dueDate: string;
  customer: string;
  debtorNo: string;
  currency: string;
  total: number;
  left: number;
  settled: boolean;
};

export default function CustomerAllocations() {
  const navigate = useNavigate();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");
  const filterCustomer = useMemo(
    () =>
      selectedCustomer !== "ALL_CUSTOMERS"
        ? (customers || []).find(
            (c: { debtor_no: number }) => String(c.debtor_no) === String(selectedCustomer)
          )
        : null,
    [customers, selectedCustomer]
  );
  const filterCustomerCurrency = resolveTransactionCurrencyCode(filterCustomer);
  const [showSettled, setShowSettled] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const inquiryParams = useMemo(
    () => ({
      ...(!showSettled ? { settled: "no" as const } : {}),
      ...(selectedCustomer !== "ALL_CUSTOMERS"
        ? { debtor_no: Number(selectedCustomer) }
        : {}),
      limit: 500,
    }),
    [selectedCustomer, showSettled]
  );

  const { data: debtorTrans = [], isLoading, isFetching } = useQuery({
    queryKey: ["customerAllocationInquiry", inquiryParams],
    queryFn: () => getCustomerAllocationInquiry(inquiryParams),
    placeholderData: undefined,
  });

  const rows = useMemo(() => {
    const custMap = new Map(
      (customers || []).map((c: { debtor_no: number; name?: string; curr_code?: string }) => [
        String(c.debtor_no),
        c,
      ])
    );
    const transTypeMap = new Map(
      (transTypes || []).map((t: { trans_type: number; description?: string; name?: string }) => [
        String(t.trans_type),
        t,
      ])
    );

    const data = Array.isArray(debtorTrans) ? debtorTrans : [];
    const allowedTypes = showSettled ? [10, 11, 12] : [11, 12];

    const toRow = (t: Record<string, unknown>): AllocationRow => {
      const debtorNo = String(t.debtor_no ?? "");
      const customer = custMap.get(debtorNo) as
        | { name?: string; curr_code?: string }
        | undefined;
      const transTypeId = Number(t.trans_type ?? 0);
      const transType = transTypeMap.get(String(transTypeId)) as
        | { description?: string; name?: string }
        | undefined;
      const transNo = t.trans_no ?? "";
      const absTotal = Math.abs(Number(t.document_total ?? 0));
      const left = Math.max(
        0,
        Number(t.left_to_allocate ?? Math.abs(Number(t.balance ?? 0)))
      );
      const reference = String(t.reference ?? "").trim();

      return {
        id: `${debtorNo}-${transTypeId}-${transNo}`,
        type:
          transType?.description ??
          transType?.name ??
          (transTypeId === 10
            ? "Sales Invoice"
            : transTypeId === 11
              ? "Customer Credit Note"
              : "Customer Payment"),
        transType: transTypeId,
        transNo: Number(transNo) || String(transNo),
        number: String(transNo),
        reference,
        date: formatDate(t.tran_date ?? t.trans_date),
        dueDate: formatDate(t.due_date),
        customer: String(t.customer_name ?? customer?.name ?? debtorNo ?? "-"),
        debtorNo,
        currency: String(t.curr_code ?? customer?.curr_code ?? "-"),
        total: absTotal,
        left,
        settled: Boolean(t.settled) || left < 0.01,
      };
    };

    const mapped = data
      .filter((t: Record<string, unknown>) => {
        const type = Number(t.trans_type ?? 0);
        if (!allowedTypes.includes(type)) return false;
        if (
          selectedCustomer !== "ALL_CUSTOMERS" &&
          String(t.debtor_no ?? "") !== String(selectedCustomer)
        ) {
          return false;
        }
        if (!showSettled && (Boolean(t.settled) || Number(t.left_to_allocate ?? Math.abs(Number(t.balance ?? 0))) < 0.01)) {
          return false;
        }
        return true;
      })
      .map(toRow);

    const type10 = mapped.filter((r) => r.transType === 10);
    const type11 = mapped.filter((r) => r.transType === 11);
    const type12 = mapped.filter((r) => r.transType === 12);

    return [...type10, ...type11, ...type12];
  }, [debtorTrans, customers, transTypes, selectedCustomer, showSettled]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const settledCount = rows.filter((r) => r.settled).length;
  const openCount = rows.length - settledCount;

  const openAllocateRows = rows.filter(
    (r) => (r.transType === 11 || r.transType === 12) && r.left > 0.001
  );

  const navigateToAllocate = (r: AllocationRow) => {
    const params = new URLSearchParams({
      transNo: String(r.transNo),
      transType: String(r.transType),
      debtorNo: String(r.debtorNo),
    });
    navigate(
      `/sales/transactions/allocate-customer-payments-credit-notes/view-allocations?${params.toString()}`,
      {
        state: {
          transNo: Number(r.transNo),
          transType: Number(r.transType),
          debtorNo: r.debtorNo,
          reference: r.reference,
          customer: r.customer,
        },
      }
    );
  };

  const navigateToView = (r: AllocationRow) => {
    if (r.transType === 12) {
      navigate(
        `/sales/transactions/customer-payments/view-customer-payment?trans_no=${r.transNo}`,
        {
          state: {
            transNo: r.transNo,
            transType: r.transType,
            reference: r.reference,
            dateOfDeposit: r.date,
            amount: r.total,
            fromAllocations: true,
          },
        }
      );
      return;
    }
    if (r.transType === 11) {
      navigate("/sales/transactions/customer-credit-notes/view-customer-credit-note", {
        state: {
          trans_no: r.transNo,
          reference: r.reference,
          date: r.date,
          fromAllocations: true,
        },
      });
      return;
    }
    navigate("/sales/inquiriesandreports/customer-transaction-inquiry/update-customer-invoice/", {
      state: {
        trans_no: r.transNo,
        reference: r.reference,
        date: r.date,
        debtor_no: r.debtorNo,
        fromAllocations: true,
      },
    });
  };

  const selectedRow = rows.find((r) => r.id === selectedRowId) ?? null;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Customer Allocations" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Sales", href: "/sales/transactions" },
              { title: "Transactions", href: "/sales/transactions" },
              { title: "Customer Allocations" },
            ]}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isLoading || isFetching
              ? "Loading…"
              : `${rows.length} record(s) — ${openCount} open, ${settledCount} settled`}
            {showSettled
              ? " (includes fully paid sales invoices)"
              : " (open payments and credit notes only)"}
          </Typography>
          {selectedRow && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Selected: {selectedRow.type} #{selectedRow.number} — {selectedRow.customer} —{" "}
              {formatTransactionMoney(selectedRow.left, selectedRow.currency)} left
            </Typography>
          )}
        </Box>

        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomer}
              label="Select Customer"
              onChange={(e) => {
                setSelectedCustomer(String(e.target.value));
                setSelectedRowId(null);
                setPage(0);
              }}
            >
              <MenuItem value="ALL_CUSTOMERS">All Customers</MenuItem>
              {(customers || []).map((c: { debtor_no: number; name?: string; customer_name?: string }) => (
                <MenuItem key={c.debtor_no} value={String(c.debtor_no)}>
                  {c.name ?? c.customer_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCustomer !== "ALL_CUSTOMERS" ? (
            <Typography variant="body2" sx={{ alignSelf: "center" }}>
              <b>Currency:</b> {filterCustomerCurrency}
            </Typography>
          ) : null}

          <FormControlLabel
            control={
              <Checkbox
                checked={showSettled}
                onChange={(e) => {
                  setShowSettled(e.target.checked);
                  setSelectedRowId(null);
                  setPage(0);
                }}
              />
            }
            label="Show Settled Items"
          />

          {selectedRow &&
            (selectedRow.transType === 11 || selectedRow.transType === 12) &&
            selectedRow.left > 0.001 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigateToAllocate(selectedRow)}
              >
                Allocate Selected
              </Button>
            )}

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/sales/transactions")}
          >
            Back
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Transaction Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Left to Allocate</TableCell>
              {showSettled && <TableCell align="center">Status</TableCell>}
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 11 : 10} align="center">
                  Loading customer allocations…
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 11 : 10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {selectedCustomer !== "ALL_CUSTOMERS"
                      ? "No open allocations for this customer."
                      : "No records found."}
                    {!showSettled
                      ? " Enable “Show Settled Items” to include fully paid invoices and settled payments."
                      : ""}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  selected={selectedRowId === r.id}
                  onClick={() => setSelectedRowId(r.id)}
                  sx={{
                    cursor: "pointer",
                    ...(r.settled ? { backgroundColor: "action.hover" } : undefined),
                    ...(selectedRowId === r.id
                      ? { backgroundColor: "action.selected" }
                      : undefined),
                  }}
                >
                  <TableCell>{r.type}</TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      size="small"
                      sx={{ textDecoration: "underline", textTransform: "none" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToView(r);
                      }}
                    >
                      {r.number}
                    </Button>
                  </TableCell>
                  <TableCell>{r.reference}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.dueDate}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.total, r.currency)}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.left, r.currency)}</TableCell>
                  {showSettled && (
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        color={r.settled ? "success.main" : "warning.main"}
                        fontWeight={600}
                      >
                        {r.settled ? "Settled" : "Open"}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    {r.transType === 10 && r.left > 0.001 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate("/sales/transactions/customer-payments", {
                            state: {
                              transNo: r.transNo,
                              transType: r.transType,
                              debtor_no: r.debtorNo,
                            },
                          })
                        }
                      >
                        Payment
                      </Button>
                    )}
                    {(r.transType === 11 || r.transType === 12) && r.left > 0.001 && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => navigateToAllocate(r)}
                      >
                        Allocate
                      </Button>
                    )}
                    {r.settled && (
                      <Typography variant="caption" color="text.secondary">
                        Settled
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, { label: "All", value: -1 }]}
                colSpan={showSettled ? 11 : 10}
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {!isLoading && openAllocateRows.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Tip: click a row to select it, then use Allocate Selected or the row action button.
        </Typography>
      )}
    </Stack>
  );
}
