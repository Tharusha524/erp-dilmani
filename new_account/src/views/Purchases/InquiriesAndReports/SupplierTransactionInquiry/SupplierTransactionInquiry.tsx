import React, { useState, useMemo, useCallback } from "react";
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
  TablePagination,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getSupplierTransactionsInquiry } from "../../../../api/Purchases/PurchasesApi";
import {
  invalidatePurchasingQueries,
  voidPurchasingDocument,
} from "../../../../utils/voidPurchasingDocument";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";

interface Row {
  id: number;
  currency: string;
  type: string;
  typeCode: number;
  number: string;
  reference: string;
  supplier: string;
  supplierId: string;
  supplierReference: string;
  date: string;
  due_date: string;
  amount: number;
  alloc: number;
  balance: number;
}

type AppliedFilters = {
  selectedSupplier: string;
  type: string;
  fromDate: string;
  toDate: string;
};

function formatDate(val: unknown): string {
  if (!val) return "";
  const s = String(val);
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
}

export default function SupplierTransactionInquiry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navState = (location.state as { fromDate?: string; toDate?: string }) || {};
  const isMobile = useMediaQuery((t: Theme) => t.breakpoints.down("md"));

  const [selectedSupplier, setSelectedSupplier] = useState("ALL_SUPPLIERS");
  const [type, setType] = useState("ALL_TYPES");
  const [fromDate, setFromDate] = useState(navState.fromDate ?? "");
  const [toDate, setToDate] = useState(navState.toDate ?? "");

  const [applied, setApplied] = useState<AppliedFilters>({
    selectedSupplier: "ALL_SUPPLIERS",
    type: "ALL_TYPES",
    fromDate: navState.fromDate ?? "",
    toDate: navState.toDate ?? "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  const inquiryParams = useMemo(() => {
    const params: Record<string, unknown> = { limit: 500 };

    if (applied.selectedSupplier !== "ALL_SUPPLIERS") {
      params.supplier_id = Number(applied.selectedSupplier);
    }
    if (applied.fromDate) params.from_date = applied.fromDate;
    if (applied.toDate) params.to_date = applied.toDate;

    if (applied.type === "UNSETTLED") {
      params.unsettled = true;
    } else if (applied.type === "OVERDUE_CREDIT_NOTES") {
      params.overdue_credit = true;
    } else if (/^\d+$/.test(applied.type)) {
      params.trans_type = Number(applied.type);
    }

    return params;
  }, [applied]);

  const { data: suppTrans = [], isLoading, isFetching } = useQuery({
    queryKey: ["supplierTransactionInquiry", inquiryParams],
    queryFn: () => getSupplierTransactionsInquiry(inquiryParams),
  });

  const handleSearch = useCallback(() => {
    setApplied({
      selectedSupplier,
      type,
      fromDate,
      toDate,
    });
    setPage(0);
  }, [selectedSupplier, type, fromDate, toDate]);

  const handleVoid = useCallback(
    async (r: Row) => {
      if (![20, 21, 22, 25].includes(r.typeCode)) return;
      if (!window.confirm(`Void ${r.type} #${r.number}?`)) return;
      const memo = window.prompt("Void reason (optional):") ?? undefined;
      const result = await voidPurchasingDocument(
        r.typeCode,
        Number(r.number),
        memo || undefined
      );
      if (result.ok === false) {
        alert(result.message);
        return;
      }
      await invalidatePurchasingQueries(queryClient);
      alert("Document voided.");
    },
    [queryClient]
  );

  const displayRows = useMemo(() => {
    const mapped = (Array.isArray(suppTrans) ? suppTrans : []).map((t: any) => {
      const transType = Number(t.trans_type ?? t.type ?? 0) || 0;
      const transNo = t.trans_no ?? t.id ?? 0;
      const supplierId = String(t.supplier_id ?? t.supplier ?? "");
      const suppObj = (suppliers || []).find(
        (s: any) => String(s.supplier_id ?? s.id) === supplierId
      );
      const tt = (transTypes || []).find(
        (x: any) => Number(x.trans_type ?? x.type) === transType
      );
      const typeDesc =
        transType === 25
          ? "Purchase Order Delivery"
          : tt?.description ?? tt?.name ?? String(transType);

      const amount = Number(
        t.amount ?? t.document_total ?? (
          Number(t.ov_amount ?? 0) +
          Number(t.ov_gst ?? 0) +
          Number(t.ov_discount ?? 0)
        )
      );
      const alloc = Number(t.allocated ?? t.alloc ?? 0);
      const balance = Number(t.balance ?? Math.max(0, Math.abs(amount) - alloc));

      return {
        id: Number(transNo),
        type: typeDesc,
        typeCode: transType,
        number: String(transNo),
        reference: String(t.reference ?? ""),
        supplier: String(t.supplier_name ?? suppObj?.supp_name ?? suppObj?.name ?? ""),
        supplierId,
        supplierReference: String(t.supp_reference ?? ""),
        date: formatDate(t.trans_date ?? t.date),
        due_date: formatDate(t.due_date),
        currency: String(t.curr_code ?? suppObj?.curr_code ?? ""),
        amount,
        alloc,
        balance,
      } as Row;
    });

    let rows = mapped;

    if (applied.type === "JOURNAL_ENTRIES") {
      rows = rows.filter((r) => r.type.toLowerCase().includes("journal"));
    }

    if (applied.fromDate) {
      rows = rows.filter(
        (r) => r.date && String(r.date) >= String(applied.fromDate)
      );
    }
    if (applied.toDate) {
      rows = rows.filter(
        (r) => r.date && String(r.date) <= String(applied.toDate)
      );
    }

    rows.sort((a, b) => {
      const typeCmp = a.typeCode - b.typeCode;
      if (typeCmp !== 0) return typeCmp;
      return String(b.date).localeCompare(String(a.date));
    });

    return rows;
  }, [suppTrans, suppliers, transTypes, applied]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return displayRows;
    return displayRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [displayRows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={2}>
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
          <PageTitle title="Supplier Transaction Inquiry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Inquiries and Reports", href: "/purchase/inquiriesandreports" },
              { title: "Supplier Transaction Inquiry" },
            ]}
          />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="supplier-label">Select Supplier</InputLabel>
              <Select
                labelId="supplier-label"
                value={selectedSupplier}
                label="Select Supplier"
                onChange={(e) => setSelectedSupplier(String(e.target.value))}
              >
                <MenuItem value="ALL_SUPPLIERS">All Suppliers</MenuItem>
                {(suppliers || []).map((s: any) => (
                  <MenuItem
                    key={s.supplier_id ?? s.id}
                    value={String(s.supplier_id ?? s.id)}
                  >
                    {s.supp_name ?? s.name ?? s.supplier_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={type}
                label="Type"
                onChange={(e) => setType(String(e.target.value))}
              >
                <MenuItem value="ALL_TYPES">All Types</MenuItem>
                <MenuItem value="25">GRNs</MenuItem>
                <MenuItem value="20">Invoices</MenuItem>
                <MenuItem value="UNSETTLED">Unsettled Transactions</MenuItem>
                <MenuItem value="22">Payments</MenuItem>
                <MenuItem value="21">Credit Notes</MenuItem>
                <MenuItem value="OVERDUE_CREDIT_NOTES">Overdue Credit Notes</MenuItem>
                <MenuItem value="JOURNAL_ENTRIES">Journal Entries</MenuItem>
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
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={isFetching}
            >
              {isFetching ? "Searching…" : "Search"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Supplier&apos;s Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading transactions…
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No supplier transactions match your search.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => (
                <TableRow key={`${r.typeCode}-${r.id}`} hover>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.number}</TableCell>
                  <TableCell>{r.reference}</TableCell>
                  <TableCell>{r.supplier}</TableCell>
                  <TableCell>{r.supplierReference}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.due_date}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.amount, r.currency)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                      {r.typeCode !== 25 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              purchasesGlJournalPath({
                                trans_no: Number(r.number),
                                trans_type: r.typeCode,
                                reference: r.reference,
                                date: r.date,
                              }),
                              {
                                state: {
                                  trans_no: Number(r.number),
                                  trans_type: r.typeCode,
                                  reference: r.reference,
                                  date: r.date,
                                },
                              }
                            )
                          }
                        >
                          GL
                        </Button>
                      )}
                      {[20, 21, 22, 25].includes(r.typeCode) && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleVoid(r)}
                        >
                          Void
                        </Button>
                      )}
                      {r.typeCode === 20 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              "/purchase/transactions/supplier-invoice/view-supplier-invoice",
                              {
                                state: {
                                  transNo: r.number,
                                  transType: 20,
                                  trans_no: Number(r.number),
                                  trans_type: 20,
                                  supplier: r.supplierId,
                                  reference: r.reference,
                                  supplierRef: r.supplierReference,
                                  invoiceDate: r.date,
                                  dueDate: r.due_date,
                                  fromInquiry: true,
                                },
                              }
                            )
                          }
                        >
                          Edit
                        </Button>
                      )}
                      {r.typeCode === 21 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              "/purchase/transactions/supplier-credit-notes/view-supplier-credit-note",
                              {
                                state: {
                                  transNo: r.number,
                                  transType: 21,
                                  supplier: r.supplierId,
                                  reference: r.reference,
                                  supplierRef: r.supplierReference,
                                  date: r.date,
                                  dueDate: r.due_date,
                                  fromAllocations: true,
                                },
                              }
                            )
                          }
                        >
                          Edit
                        </Button>
                      )}
                      {r.typeCode === 22 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              "/purchase/transactions/payment-to-suppliers/view-supplier-payment",
                              {
                                state: {
                                  transNo: r.number,
                                  transType: 22,
                                  trans_no: Number(r.number),
                                  trans_type: 22,
                                  supplier: r.supplierId,
                                  reference: r.reference,
                                  datePaid: r.date,
                                  amount: Math.abs(r.amount),
                                },
                              }
                            )
                          }
                        >
                          Edit
                        </Button>
                      )}
                      {r.typeCode === 20 && r.balance > 0.001 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate("/purchase/transactions/supplier-credit-notes", {
                              state: {
                                supplier: r.supplierId,
                                invoiceNo: r.number,
                                supplierRef: r.supplierReference,
                                reference: r.reference,
                                date: r.date,
                              },
                            })
                          }
                        >
                          Credit this
                        </Button>
                      )}
                      {(r.typeCode === 20 || r.typeCode === 21 || r.typeCode === 22) && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            if (r.typeCode === 20) {
                              navigate(
                                "/purchase/transactions/supplier-invoice/view-supplier-invoice",
                                {
                                  state: {
                                    transNo: r.number,
                                    transType: 20,
                                    supplier: r.supplierId,
                                    reference: r.reference,
                                    supplierRef: r.supplierReference,
                                    invoiceDate: r.date,
                                    dueDate: r.due_date,
                                    fromInquiry: true,
                                    autoPrint: true,
                                  },
                                }
                              );
                            } else if (r.typeCode === 21) {
                              navigate(
                                "/purchase/transactions/supplier-credit-notes/view-supplier-credit-note",
                                {
                                  state: {
                                    transNo: r.number,
                                    transType: 21,
                                    supplier: r.supplierId,
                                    reference: r.reference,
                                    supplierRef: r.supplierReference,
                                    date: r.date,
                                    fromAllocations: true,
                                    autoPrint: true,
                                  },
                                }
                              );
                            } else {
                              navigate(
                                "/purchase/transactions/payment-to-suppliers/view-supplier-payment",
                                {
                                  state: {
                                    transNo: r.number,
                                    trans_no: Number(r.number),
                                    transType: 22,
                                    trans_type: 22,
                                    supplier: r.supplierId,
                                    reference: r.reference,
                                    datePaid: r.date,
                                    amount: Math.abs(r.amount),
                                    autoPrint: true,
                                  },
                                }
                              );
                            }
                          }}
                        >
                          Print
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={10}
                count={displayRows.length}
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
    </Stack>
  );
}
