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
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  TablePagination,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { resolveTransactionCurrencyCode } from "../../../../utils/relationId";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import { getCustomerAllocationInquiry } from "../../../../api/SalesInquiry/SalesInquiryApi";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  type: string;
  number: string;
  reference: string;
  order: string;
  date: string;
  dueDate: string;
  debit: number;
  credit: number;
  allocated: number;
  balance: number;
  trans_type: string;
  debtorNo: string;
  currency: string;
}

export default function CustomerAllocationInquiry() {
  const navigate = useNavigate();

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // filters
  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("ALL_TYPES");
  const [showSettled, setShowSettled] = useState(false);
  const [applied, setApplied] = useState({
    selectedCustomer: "ALL_CUSTOMERS",
    fromDate: "",
    toDate: "",
    type: "ALL_TYPES",
    showSettled: false,
  });

  const handleSearch = () => {
    setApplied({ selectedCustomer, fromDate, toDate, type, showSettled });
    setPage(0);
  };

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const inquiryParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      limit: 500,
    };
    if (applied.selectedCustomer !== "ALL_CUSTOMERS") params.debtor_no = Number(applied.selectedCustomer);
    if (applied.fromDate) params.from_date = applied.fromDate;
    if (applied.toDate) params.to_date = applied.toDate;
    if (applied.type !== "ALL_TYPES" && applied.type !== "UNSETTLE_TRANSACTIONS" && /^\d+$/.test(String(applied.type))) {
      params.trans_type = Number(applied.type);
    }
    if (!applied.showSettled) params.settled = "no";
    return params;
  }, [applied]);

  const { data: debtorTrans = [] } = useQuery({
    queryKey: ["customerAllocationInquiry", inquiryParams],
    queryFn: () => getCustomerAllocationInquiry(inquiryParams),
  });
  const { data: transTypes = [] } = useQuery({ queryKey: ["transTypes"], queryFn: getTransTypes });

  // Map debtor trans to table rows
  const rows: Row[] = React.useMemo(
    () =>
      (debtorTrans || []).map((dt: any, idx: number) => {
        const absoluteTotal = Math.abs(Number(dt.document_total ?? (
          Number(dt.ov_amount || 0) +
          Number(dt.ov_gst || 0) +
          Number(dt.ov_freight || 0) +
          Number(dt.ov_freight_tax || 0) +
          Number(dt.ov_discount || 0)
        )));
        const allocatedTotal = Math.abs(Number(dt.alloc || 0));

        // Resolve transaction type
        const transTypeObj = transTypes.find(
          (tt: any) => String(tt.trans_type) === String(dt.trans_type)
        );
        const transTypeLabel = transTypeObj
          ? transTypeObj.description || transTypeObj.name || String(dt.trans_type)
          : String(dt.trans_type);

        const transType = String(dt.trans_type || "");
        const debit = transType === "10" || transType === "13" ? absoluteTotal : 0;
        const credit = transType === "12" || transType === "11" ? absoluteTotal : 0;
        const balance = Math.abs(Number(dt.balance ?? Math.max(0, absoluteTotal - allocatedTotal)));
        const customer = customers.find(
          (c: { debtor_no: number }) => String(c.debtor_no) === String(dt.debtor_no)
        );

        return {
          id: dt.id ?? idx,
          type: transTypeLabel,
          number: String(dt.trans_no || ""),
          reference: dt.reference || "",
          order: dt.order_no || "",
          date: dt.tran_date ? String(dt.tran_date).split(" ")[0] : "",
          dueDate: dt.due_date ? String(dt.due_date).split(" ")[0] : "",
          debit,
          credit,
          allocated: allocatedTotal,
          balance,
          trans_type: transType,
          debtorNo: String(dt.debtor_no ?? ""),
          currency:
            String(dt.curr_code ?? customer?.curr_code ?? "")
              .trim()
              .toUpperCase() || resolveTransactionCurrencyCode(customer),
        } as Row;
      }),
    [debtorTrans, transTypes, customers]
  );

  // pagination
  const { filteredRows, paginatedRows } = React.useMemo(() => {
    let filtered = rows;
    if (applied.selectedCustomer && applied.selectedCustomer !== "ALL_CUSTOMERS") {
      filtered = filtered.filter(
        (r) => String(r.debtorNo ?? "") === String(applied.selectedCustomer)
      );
    }
    if (applied.type && applied.type !== "ALL_TYPES") {
      if (applied.type === "UNSETTLE_TRANSACTIONS") {
        filtered = filtered.filter((r) => r.balance > 0.001);
      } else {
      const isNumeric = /^\d+$/.test(String(applied.type));
      if (isNumeric) {
        filtered = filtered.filter((r) => String(r.trans_type ?? "") === String(applied.type));
      } else {
        filtered = filtered.filter((r) => String(r.type ?? "").toUpperCase().includes(applied.type.toUpperCase()));
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
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset page if out of range
  React.useEffect(() => {
    const maxPage = Math.ceil(filteredRows.length / rowsPerPage) - 1;
    if (page > maxPage) {
      setPage(Math.max(0, maxPage));
    }
  }, [filteredRows.length, rowsPerPage, page]);

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
          <PageTitle title="Customer Allocation Inquiry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Inquiries and Reports", href: "/sales/inquiriesandreports" },
              { title: "Customer Allocation Inquiry" },
            ]}
          />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
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

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
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
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
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
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showSettled}
                  onChange={(e) => {
                    setShowSettled(e.target.checked);
                    setPage(0);
                  }}
                  color="primary"
                />
              }
              label="Show Settled"
            />
          </Grid>

          <Grid item xs={12} sm={2} md={1}>
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
              <TableCell>Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Allocated</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.number}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell>{r.order}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.dueDate}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.debit, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.credit, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.allocated, r.currency)}</TableCell>
                <TableCell align="right">{formatTransactionMoney(r.balance, r.currency)}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {(() => {
                      const transTypeNum = Number(r.trans_type);
                      const isPaymentOrCredit = transTypeNum === 11 || transTypeNum === 12;
                      const isInvoice = transTypeNum === 10;
                      const left = Math.max(0, Number(r.balance || 0));

                      if (isInvoice && left > 0.001) {
                        return (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                navigate("/sales/transactions/customer-payments", {
                                  state: {
                                    transNo: r.number,
                                    transType: transTypeNum,
                                    debtor_no: r.debtorNo,
                                  },
                                })
                              }
                            >
                              Payment
                            </Button>
                          </>
                        );
                      }

                      if (isPaymentOrCredit && left > 0.001) {
                        return (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              navigate(
                                "/sales/transactions/allocate-customer-payments-credit-notes/view-allocations",
                                {
                                  state: {
                                    transNo: Number(r.number),
                                    transType: transTypeNum,
                                  },
                                }
                              )
                            }
                          >
                            Allocate
                          </Button>
                        );
                      }

                      if (isPaymentOrCredit && left <= 0.001) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Settled
                          </Typography>
                        );
                      }

                      return null;
                    })()}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={12}
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
