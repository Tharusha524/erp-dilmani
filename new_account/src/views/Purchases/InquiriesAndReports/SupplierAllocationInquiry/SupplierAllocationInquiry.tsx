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
  Checkbox,
  FormControlLabel,
  TablePagination,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getSupplierAllocationsInquiry } from "../../../../api/Purchases/PurchasesApi";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  type: string;
  typeCode: number;
  number: string;
  reference: string;
  supplier: string;
  supplierId: string | number;
  suppReference: string;
  date: string;
  dueDate: string;
  debit: number;
  credit: number;
  allocated: number;
  balance: number;
  currency: string;
  settled: boolean;
}

type AppliedFilters = {
  selectedSupplier: string;
  fromDate: string;
  toDate: string;
  type: string;
  showSettled: boolean;
};

const TYPE_TO_API: Record<string, { trans_type?: number; overdue?: boolean }> = {
  INVOICES: { trans_type: 20 },
  OVERDUE_INVOICES: { trans_type: 20, overdue: true },
  PAYMENTS: { trans_type: 22 },
  CREDIT_NOTES: { trans_type: 21 },
  OVERDUE_CREDIT_NOTES: { trans_type: 21, overdue: true },
};

function formatDate(val: unknown): string {
  if (!val) return "";
  const s = String(val);
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
}

export default function SupplierAllocationInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((t: Theme) => t.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedSupplier, setSelectedSupplier] = useState("ALL_SUPPLIERS");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [type, setType] = useState("ALL_TYPES");
  const [showSettled, setShowSettled] = useState(false);

  const [applied, setApplied] = useState<AppliedFilters>({
    selectedSupplier: "ALL_SUPPLIERS",
    fromDate: "",
    toDate: "",
    type: "ALL_TYPES",
    showSettled: false,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  const inquiryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: 500,
    };

    // FA: unchecked = hide fully allocated; checked = show all (including settled)
    if (!applied.showSettled) {
      params.settled = "no";
    }

    if (applied.selectedSupplier !== "ALL_SUPPLIERS") {
      params.supplier_id = Number(applied.selectedSupplier);
    }
    if (applied.fromDate) params.from_date = applied.fromDate;
    if (applied.toDate) params.to_date = applied.toDate;

    const typeMapping = TYPE_TO_API[applied.type];
    if (typeMapping?.trans_type) params.trans_type = typeMapping.trans_type;
    if (typeMapping?.overdue) params.overdue = true;

    return params;
  }, [applied]);

  const { data: suppTrans = [], isLoading, isFetching } = useQuery({
    queryKey: ["supplierAllocationInquiry", inquiryParams],
    queryFn: () => getSupplierAllocationsInquiry(inquiryParams),
  });

  const handleSearch = useCallback(() => {
    setApplied({
      selectedSupplier,
      fromDate,
      toDate,
      type,
      showSettled,
    });
    setPage(0);
  }, [selectedSupplier, fromDate, toDate, type, showSettled]);

  const displayRows = useMemo(() => {
    const mapped = (Array.isArray(suppTrans) ? suppTrans : []).map((t: any) => {
      const typeCode = Number(t.trans_type ?? 0) || 0;
      const transNo = t.trans_no ?? t.id ?? 0;
      const supplierId = t.supplier_id ?? "";
      const suppObj = (suppliers || []).find(
        (s: any) => String(s.supplier_id ?? s.id) === String(supplierId)
      );
      const tt = (transTypes || []).find(
        (x: any) => Number(x.trans_type ?? x.type) === typeCode
      );
      const typeDesc = tt?.description ?? tt?.name ?? String(typeCode);

      const absTotal = Math.abs(Number(t.document_total ?? 0));
      const balance = Math.max(0, Number(t.balance ?? 0));
      const allocated = Number(t.allocated ?? Math.max(0, absTotal - balance));

      const debit = typeCode === 20 ? 0 : absTotal;
      const credit = typeCode === 20 ? absTotal : 0;

      return {
        id: Number(transNo),
        type: typeDesc,
        typeCode,
        number: String(transNo),
        reference: String(t.reference ?? ""),
        supplier: String(t.supplier_name ?? suppObj?.supp_name ?? ""),
        supplierId,
        suppReference: String(t.supp_reference ?? ""),
        date: formatDate(t.trans_date),
        dueDate: formatDate(t.due_date),
        debit,
        credit,
        allocated,
        balance,
        currency: String(suppObj?.curr_code ?? t.curr_code ?? ""),
        settled: balance < 0.01,
      } as Row;
    });

    let rows = mapped;

    if (applied.type === "JOURNAL_ENTRIES") {
      rows = rows.filter((r) => r.type.toLowerCase().includes("journal"));
    }

    const byType20 = rows.filter((r) => r.typeCode === 20);
    const byType21 = rows.filter((r) => r.typeCode === 21);
    const byType22 = rows.filter((r) => r.typeCode === 22);
    const others = rows.filter((r) => ![20, 21, 22].includes(r.typeCode));

    return [...byType20, ...byType21, ...byType22, ...others];
  }, [suppTrans, suppliers, transTypes, applied.type]);

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
          <PageTitle title="Supplier Allocation Inquiry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Inquiries and Reports", href: "/purchases/inquiriesandreports" },
              { title: "Supplier Allocation Inquiry" },
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
                  <MenuItem key={s.supplier_id ?? s.id} value={String(s.supplier_id ?? s.id)}>
                    {s.supp_name ?? s.name}
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
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                value={type}
                label="Type"
                onChange={(e) => setType(String(e.target.value))}
              >
                <MenuItem value="ALL_TYPES">All Types</MenuItem>
                <MenuItem value="INVOICES">Invoices</MenuItem>
                <MenuItem value="OVERDUE_INVOICES">Overdue Invoices</MenuItem>
                <MenuItem value="PAYMENTS">Payments</MenuItem>
                <MenuItem value="CREDIT_NOTES">Credit Notes</MenuItem>
                <MenuItem value="OVERDUE_CREDIT_NOTES">Overdue Credit Notes</MenuItem>
                <MenuItem value="JOURNAL_ENTRIES">Journal Entries</MenuItem>
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
              <TableCell>Supp Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Allocated</TableCell>
              <TableCell align="right">Balance</TableCell>
              {showSettled && <TableCell align="center">Status</TableCell>}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 13 : 12} align="center">
                  Loading allocations…
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSettled ? 13 : 12} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No allocation records match your search.
                    {!showSettled
                      ? " Enable “Show Settled” to include fully allocated items."
                      : ""}
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
                  <TableCell>{r.suppReference}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.dueDate}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.debit, r.currency)}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.credit, r.currency)}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.allocated, r.currency)}</TableCell>
                  <TableCell align="right">{formatTransactionMoney(r.balance, r.currency)}</TableCell>
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
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                      {r.typeCode === 20 && r.balance > 0.001 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate("/purchase/transactions/payment-to-suppliers", {
                              state: { supplier: r.supplierId },
                            })
                          }
                        >
                          Payment
                        </Button>
                      )}
                      {(r.typeCode === 21 || r.typeCode === 22) && r.balance > 0.001 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              "/purchase/transactions/allocate-supplier-payments-credit-notes/view-supplier-allocations",
                              { state: { transNo: r.id, transType: r.typeCode } }
                            )
                          }
                        >
                          Allocate
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
                colSpan={showSettled ? 13 : 12}
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
