import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState } from "react";
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
  TableFooter,
  Paper,
  TextField,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomerTransactionInquiry } from "../../../../api/SalesInquiry/SalesInquiryApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import { getFiscalYears } from "../../../../api/FiscalYear/FiscalYearApi";
import { getDebtorTransDetails } from "../../../../api/DebtorTrans/DebtorTransDetailsApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { navigateSalesInquiryPrint } from "../../../../utils/salesInquiryPrint";

function debtorDocumentTotal(t: any): number {
  return (
    Number(t.ov_amount ?? 0) +
    Number(t.ov_gst ?? 0) +
    Number(t.ov_freight ?? 0) +
    Number(t.ov_freight_tax ?? 0) +
    Number(t.ov_discount ?? 0)
  );
}

function signedTransactionAmount(transType: string | number, t: any): number {
  const total = Math.abs(debtorDocumentTotal(t));
  return String(transType) === "12" || String(transType) === "11" ? -total : total;
}

function transactionOutstanding(transType: string | number, t: any): number {
  const docTotal = Math.abs(debtorDocumentTotal(t));
  const alloc = Number(t.alloc ?? 0);
  const outstanding = Math.max(0, docTotal - alloc);
  const typeStr = String(transType);
  if (typeStr === "11" || typeStr === "12") {
    return outstanding > 0 ? -outstanding : 0;
  }
  return outstanding;
}

function agingBuckets(
  outstanding: number,
  dueDate: string,
  transType: string | number
): { current: number; days_1_30: number; days_31_60: number; over_60_days: number } {
  const buckets = { current: 0, days_1_30: 0, days_31_60: 0, over_60_days: 0 };
  if (Math.abs(outstanding) <= 0.001) return buckets;

  if (!dueDate || String(transType) !== "10") {
    buckets.current = outstanding;
    return buckets;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  if (isNaN(due.getTime())) {
    buckets.current = outstanding;
    return buckets;
  }

  const daysPastDue = Math.floor((today.getTime() - due.getTime()) / 86400000);
  if (daysPastDue <= 0) buckets.current = outstanding;
  else if (daysPastDue <= 30) buckets.days_1_30 = outstanding;
  else if (daysPastDue <= 60) buckets.days_31_60 = outstanding;
  else buckets.over_60_days = outstanding;

  return buckets;
}

interface Row {
  id: number;
  currency: string;
  terms: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  over_60_days: number;
  total_balance: number;
  balance: number;
  type: string;
  trans_type_id?: string | number;
  number: string;
  order: string;
  reference: string;
  date: string;
  due_date: string;
  branch: string;
  amount: number;
  debtor_no?: string | number;
  branch_code?: string | number;
}

export default function CustomerTransactionInquiry() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as { fromDate?: string; toDate?: string }) || {};
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  // Filters
  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");
  const [type, setType] = useState("ALL_TYPES");
  const [fromDate, setFromDate] = useState(navState.fromDate ?? "");
  const [toDate, setToDate] = useState(navState.toDate ?? "");
  const [showZeroValues, setShowZeroValues] = useState(false);
  const [applied, setApplied] = useState({
    selectedCustomer: "ALL_CUSTOMERS",
    type: "ALL_TYPES",
    fromDate: navState.fromDate ?? "",
    toDate: navState.toDate ?? "",
    showZeroValues: false,
  });

  const handleSearch = () => {
    setApplied({
      selectedCustomer,
      type,
      fromDate,
      toDate,
      showZeroValues,
    });
    setPage(0);
  };

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: paymentTerms = [] } = useQuery({ queryKey: ["paymentTerms"], queryFn: getPaymentTerms });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => getBranches() });
  const { data: transTypes = [] } = useQuery({ queryKey: ["transTypes"], queryFn: getTransTypes });
  const { data: fiscalYears = [] } = useQuery({ queryKey: ["fiscalYears"], queryFn: getFiscalYears });

  const inquiryParams = React.useMemo(() => ({
    ...(applied.selectedCustomer !== "ALL_CUSTOMERS" ? { debtor_no: Number(applied.selectedCustomer) } : {}),
    ...(applied.type !== "ALL_TYPES" && applied.type !== "UNSETTLE_TRANSACTIONS" && /^\d+$/.test(String(applied.type))
      ? { trans_type: Number(applied.type) }
      : {}),
    ...(applied.fromDate ? { from_date: applied.fromDate } : {}),
    ...(applied.toDate ? { to_date: applied.toDate } : {}),
    limit: 500,
  }), [applied]);

  const { data: debtorTrans = [] } = useQuery({
    queryKey: ["customerTransactionInquiry", inquiryParams],
    queryFn: () => getCustomerTransactionInquiry(inquiryParams),
  });
  const { data: debtorTransDetails = [] } = useQuery({ queryKey: ["debtorTransDetails"], queryFn: getDebtorTransDetails });

  // Function to check if a transaction's fiscal year is closed
  const isFiscalYearClosed = (transactionDate: string) => {
    if (!fiscalYears || fiscalYears.length === 0) {
      return false;
    }
    
    const transDate = new Date(transactionDate + 'T00:00:00'); // Ensure it's treated as local date
   // console.log('Parsed transaction date:', transDate);
    if (isNaN(transDate.getTime())) {
    //  console.log('Invalid transaction date');
      return false;
    }
    
    const matchingFiscalYear = fiscalYears.find((fy: any) => {
      if (!fy.fiscal_year_from || !fy.fiscal_year_to) return false;
      const from = new Date(fy.fiscal_year_from + 'T00:00:00');
      const to = new Date(fy.fiscal_year_to + 'T00:00:00');
      if (isNaN(from.getTime()) || isNaN(to.getTime())) return false;
      const isInRange = transDate >= from && transDate <= to;
     // console.log('Checking fiscal year:', fy.id, 'from:', from, 'to:', to, 'isInRange:', isInRange);
      return isInRange;
    });
    
    // If no fiscal year found for this date, allow editing
    if (!matchingFiscalYear) {
     // console.log('No matching fiscal year found for date - allowing edit');
      return false;
    }
    
    const isClosed = matchingFiscalYear.closed == 1 || matchingFiscalYear.closed === true;
    // console.log('Fiscal year check result:', { transactionDate, matchingFiscalYear, closed: matchingFiscalYear.closed, isClosed });
    return isClosed;
  };

  // Function to check if a delivery is fully invoiced
  const isDeliveryFullyInvoiced = (transNo: string) => {
    const deliveryDetails = debtorTransDetails.filter((dd: any) =>
      String(dd.debtor_trans_no) === String(transNo) && String(dd.debtor_trans_type) === "13"
    );

    if (deliveryDetails.length === 0) {
      return false;
    }

    // Check if all delivery details have quantity = qty_done
    return deliveryDetails.every((dd: any) => {
      const quantity = parseFloat(dd.quantity || 0);
      const qtyDone = parseFloat(dd.qty_done || 0);
      return quantity === qtyDone;
    });
  };

  // Map debtor_trans records to table rows, pulling currency and payment terms from debtor master when available
  const rows: Row[] = (debtorTrans || []).map((t: any, idx: number) => {
    const customer = (customers || []).find((c: any) => String(c.debtor_no) === String(t.debtor_no) || String(c.debtor_no) === String(t.debtor_no));
    // Resolve payment term description from paymentTerms lookup
    const paymentTermId = customer?.payment_terms ?? t.payment_terms;
    const paymentTermObj = (paymentTerms || []).find((pt: any) => String(pt.terms_indicator) === String(paymentTermId));
    const paymentTermLabel = paymentTermObj ? (paymentTermObj.description || paymentTermObj.terms_indicator) : (paymentTermId ? String(paymentTermId) : "");
    const branchObj = (branches || []).find((b: any) => String(b.branch_code) === String(t.branch_code) && String(b.debtor_no ?? "") === String(t.debtor_no ?? "")) || (branches || []).find((b: any) => String(b.branch_ref ?? b.branch_code ?? "") === String(t.branch_code ?? ""));
    // Resolve transaction type description
    const transTypeObj = (transTypes || []).find((tt: any) => String(tt.trans_type) === String(t.trans_type));
    const transTypeLabel = transTypeObj ? (transTypeObj.description || transTypeObj.name || String(t.trans_type)) : String(t.trans_type);
    const outstanding = transactionOutstanding(t.trans_type, t);
    const aging = agingBuckets(outstanding, t.due_date ? String(t.due_date).split(" ")[0] : "", t.trans_type);
      return {
      id: t.trans_no ?? t.id ?? idx,
      debtor_no: t.debtor_no ?? "",
      trans_type_id: t.trans_type ?? "",
      currency: customer?.curr_code ?? t.curr_code ?? "",
      terms: paymentTermLabel,
      current: aging.current,
      days_1_30: aging.days_1_30,
      days_31_60: aging.days_31_60,
      over_60_days: aging.over_60_days,
      total_balance: outstanding,
      balance: outstanding,
      type: transTypeLabel,
      number: t.trans_no ? String(t.trans_no) : "",
      order: t.order_no ? String(t.order_no) : "",
      reference: t.reference ?? "",
      date: t.tran_date ? String(t.tran_date).split(" ")[0] : "",
      due_date: t.due_date ? String(t.due_date).split(" ")[0] : "",
      branch: branchObj?.br_name ?? String(t.branch_code ?? ""),
      amount: signedTransactionAmount(t.trans_type, t),
      branch_code: t.branch_code,
    } as Row;
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { filteredRows, paginatedRows } = React.useMemo(() => {
    let filtered = applied.showZeroValues ? rows : rows.filter((r) => Math.abs(r.balance) > 0.001);
    if (applied.selectedCustomer && applied.selectedCustomer !== "ALL_CUSTOMERS") {
      filtered = filtered.filter((r) => String(r.debtor_no ?? "") === String(applied.selectedCustomer));
    }
    if (applied.type && applied.type !== "ALL_TYPES") {
      if (applied.type === "UNSETTLE_TRANSACTIONS") {
        filtered = filtered.filter((r) => Math.abs(r.balance) > 0.001);
      } else {
      const isNumeric = /^\d+$/.test(String(applied.type));
      if (isNumeric) {
        filtered = filtered.filter((r) => String(r.trans_type_id ?? "") === String(applied.type));
      } else {
        const typeMatchers: Record<string, string[]> = {
          SALES_INVOICES: ["INVOICE"],
          PAYMENTS: ["PAYMENT"],
          CREDIT_NOTES: ["CREDIT"],
          DELIVERY_NOTES: ["DELIVERY"],
          JOURNAL_ENTRIES: ["JOURNAL"],
        };
        const keywords = typeMatchers[applied.type] ?? [applied.type];
        filtered = filtered.filter((r) => {
          const label = String(r.type ?? "").toUpperCase();
          return keywords.some((k) => label.includes(k.toUpperCase()));
        });
      }
      }
    }
    if (applied.fromDate) {
      filtered = filtered.filter((r) => r.date ? String(r.date) >= String(applied.fromDate) : false);
    }
    if (applied.toDate) {
      filtered = filtered.filter((r) => r.date ? String(r.date) <= String(applied.toDate) : false);
    }

    const paginated = rowsPerPage === -1 ? filtered : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    return { filteredRows: filtered, paginatedRows: paginated };
  }, [rows, page, rowsPerPage, applied]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <FormPageLayout>
      {/* Header */}
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
          <PageTitle title="Customer Transaction Inquiry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Inquiries and Reports", href: "/sales/inquiriesandreports" },
              { title: "Customer Transaction Inquiry" },
            ]}
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>
      {/* Filters */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="customer-label">Select Customer</InputLabel>
              <Select
                labelId="customer-label"
                value={selectedCustomer}
                label="Select Customer"
                onChange={(e) => {
                  setSelectedCustomer(String(e.target.value));
                  setPage(0);
                }}
              >
                <MenuItem value="ALL_CUSTOMERS">All Customers</MenuItem>
                {(customers || []).map((c: any) => (
                  <MenuItem
                    key={c.customer_id ?? c.id ?? c.debtor_no}
                    value={String(c.debtor_no ?? c.customer_id ?? c.id ?? "")}
                  >
                    {c.name ?? c.customer_name ?? c.debtor_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={type}
                label="Type"
                onChange={(e) => {
                  setType(String(e.target.value));
                  setPage(0);
                }}
              >
                <MenuItem value="ALL_TYPES">All Types</MenuItem>
                <MenuItem value="10">Sales Invoices</MenuItem>
                <MenuItem value="UNSETTLE_TRANSACTIONS">Unsettle Transactions</MenuItem>
                <MenuItem value="12">Payments</MenuItem>
                <MenuItem value="11">Credit Notes</MenuItem>
                <MenuItem value="13">Delivery Notes</MenuItem>
                <MenuItem value="0">Journal Entries</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showZeroValues}
                  onChange={(e) => setShowZeroValues(e.target.checked)}
                  color="primary"
                />
              }
              label="Zero Values"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Table */}
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Currency</TableCell>
              <TableCell>Terms</TableCell>
              <TableCell align="right">Current</TableCell>
              <TableCell align="right">1-30 Days</TableCell>
              <TableCell align="right">31-60 Days</TableCell>
              <TableCell align="right">Over 60 Days</TableCell>
              <TableCell align="right">Total Balance</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r, idx) => (
              <TableRow key={`${r.id}-${idx}`} hover>
                <TableCell>{r.currency}</TableCell>
                <TableCell>{r.terms}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.current, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.days_1_30, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.days_31_60, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.over_60_days, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.total_balance, r.currency)}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.number}</TableCell>
                <TableCell>{r.order}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.due_date}</TableCell>
                <TableCell>{r.branch}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.amount, r.currency)}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate("/sales/transactions/gl-journal-entries", {
                          state: {
                            trans_no: Number(r.number),
                            trans_type: Number(r.trans_type_id),
                            reference: r.reference,
                            date: r.date,
                            orderNo: r.order ? Number(r.order) : undefined,
                          },
                        })
                      }
                    >
                      GL
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={
                        isFiscalYearClosed(r.date) ||
                        (String(r.trans_type_id) === "13" && isDeliveryFullyInvoiced(r.number)) ||
                        !["10", "11", "12", "13"].includes(String(r.trans_type_id))
                      }
                      onClick={
                        (isFiscalYearClosed(r.date) ||
                        (String(r.trans_type_id) === "13" && isDeliveryFullyInvoiced(r.number)) ||
                        !["10", "11", "12", "13"].includes(String(r.trans_type_id))
                        )
                        ? undefined : () => {
                        const t = String(r.trans_type_id);
                        // Sales Invoice -> open invoice update in inquiries
                        if (t === "10") {
                          navigate(
                            "/sales/inquiriesandreports/customer-transaction-inquiry/update-customer-invoice/",
                            { state: { trans_no: r.number, reference: r.reference, date: r.date, debtor_no: r.debtor_no } }
                          );
                        }
                        // Credit Note -> open customer credit edit under transactions
                        else if (t === "11") {
                          navigate(
                            "/sales/transactions/update-customer-credit-notes/",
                            { state: { trans_no: r.number, reference: r.reference, date: r.date, debtor_no: r.debtor_no } }
                          );
                        }
                        // Payment -> navigate to customer payments entry
                        else if (t === "12") {
                          navigate(
                            "/sales/transactions/update-customer-payments/",
                            { state: { trans_no: r.number, reference: r.reference, date: r.date, debtor_no: r.debtor_no } }
                          );
                        }
                        // Delivery Note -> open customer delivery update
                        else if (t === "13") {
                          navigate(
                            "/sales/transactions/update-customer-delivery/",
                            { state: { trans_no: r.number, reference: r.reference, date: r.date, debtor_no: r.debtor_no } }
                          );
                        }
                      }}
                    >
                      Edit
                    </Button>
                    {String(r.trans_type_id) === "13" && r.reference !== "auto" && !isDeliveryFullyInvoiced(r.number) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate("/sales/transactions/direct-delivery/delivery-note-invoice", { state: { trans_no: r.number, reference: r.reference, date: r.date, debtor_no: r.debtor_no } })}
                      >
                        Invoice
                      </Button>
                    )}
                    {String(r.trans_type_id) === "10" && r.balance > 0.001 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate("/sales/transactions/credit-invoice/", {
                            state: {
                              trans_no: r.number,
                              date: r.date,
                              debtor_no: r.debtor_no,
                              branch_code: r.branch_code,
                            },
                          })
                        }
                      >
                        Credit this
                      </Button>
                    )}
                    {["10", "11", "12", "13"].includes(String(r.trans_type_id)) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigateSalesInquiryPrint(navigate, r.trans_type_id ?? 0, {
                            number: r.number,
                            reference: r.reference,
                            date: r.date,
                            debtor_no: r.debtor_no,
                            order: r.order,
                          })
                        }
                      >
                        Print
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={16}
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </FormPageLayout>
  );
}
