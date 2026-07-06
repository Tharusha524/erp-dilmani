import React, { useState, useMemo, useEffect } from "react";
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
  TextField,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  TableFooter,
  TablePagination,
  ListSubheader,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import DeleteConfirmationModal from "../../../../components/DeleteConfirmationModal";
import theme from "../../../../theme";
import api from "../../../../api/apiClient";
import { deleteJournalTransaction } from "../../../../api/Journals/JournalApi";
import DimensionSelect from "../../../../components/DimensionSelect";
import { formatAccountingAmount } from "../../../../utils/accountingDisplay";
import { notify } from "../../../../services/notificationService";

interface GlInquirySummary {
  account_code: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  period_movement: number;
  closing_balance: number;
}

interface Row {
  id: number;
  type: string;
  transType: string;
  number: string;
  reference: string;
  date: string;
  account: string;
  dimension: string;
  personItem: string;
  debit: string;
  credit: string;
  memo: string;
}

export default function GLInquiry() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as {
    selectedAccount?: string;
    fromDate?: string;
    toDate?: string;
    dimension?: string;
    autoSearch?: boolean;
  }) || {};
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<GlInquirySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch GL accounts for Account dropdown
  const { data: chartMasters = [] } = useQuery({
    queryKey: ["chartMasters"],
    queryFn: () => import("../../../../api/GLAccounts/ChartMasterApi").then(m => m.getChartMasters()),
  });

  // Fetch GL Account Groups from backend
  const { data: chartTypes = [] } = useQuery({
    queryKey: ["chartTypes"],
    queryFn: () => import("../../../../api/GLAccounts/ChartTypeApi").then(m => m.getChartTypes()),
  });

  // Group chart masters by backend GL Account Group names
  const groupedChartMasters = useMemo(() => {
    const groupsMap: Record<string, any[]> = {};

    (chartMasters as any[]).forEach((acc: any) => {
      const matchedGroup = (chartTypes as any[]).find((g: any) => String(g.id) === String(acc.account_type));
      const typeText = matchedGroup ? matchedGroup.name : "Unknown Group";

      if (!groupsMap[typeText]) groupsMap[typeText] = [];
      groupsMap[typeText].push(acc);
    });

    // sort each group's accounts by account_code for stable order
    Object.values(groupsMap).forEach((arr) =>
      arr.sort((a: any, b: any) => (String(a.account_code || "")).localeCompare(String(b.account_code || "")))
    );
    return groupsMap;
  }, [chartMasters, chartTypes]);

  // Search form state
  const [selectedAccount, setSelectedAccount] = useState(navState.selectedAccount ?? "");
  const [fromDate, setFromDate] = useState(navState.fromDate ?? "");
  const [toDate, setToDate] = useState(navState.toDate ?? "");
  const [dimension, setDimension] = useState(navState.dimension ?? "");
  const [memo, setMemo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [openAccountSelect, setOpenAccountSelect] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleShow = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/gl-trans/search", {
        selectedAccount,
        fromDate,
        toDate,
        dimension,
        memo,
        amountMin,
        amountMax,
      });

      const payload = response.data;
      const list = Array.isArray(payload) ? payload : payload?.rows ?? [];

      const transformedRows: Row[] = list.map((item: any, index: number) => ({
        id: Number(item.id ?? index),
        type: item.type || "",
        transType: String(item.trans_type ?? item.transType ?? ""),
        number: String(item.number ?? ""),
        reference: item.reference || "",
        date: item.date || "",
        account: item.account || "",
        dimension: item.dimension || "",
        personItem: item.personItem || "",
        debit: item.debit?.toString() || "0",
        credit: item.credit?.toString() || "0",
        memo: item.memo || "",
      }));

      setRows(transformedRows);
      setSummary(
        payload && !Array.isArray(payload) && payload.summary
          ? (payload.summary as GlInquirySummary)
          : null
      );
      setPage(0);
    } catch (error: any) {
      console.error("GL search failed:", error);
      setRows([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (navState.autoSearch && navState.selectedAccount && navState.fromDate && navState.toDate) {
      void handleShow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paginatedRows = React.useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (row: Row) => {
    if (!row.transType || !row.number) {
      notify.warning("Cannot void this entry — transaction type or number is missing.");
      return;
    }
    setDeleteError("");
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJournalTransaction(deleteTarget.transType, deleteTarget.number, {
        void_date: new Date().toISOString().split("T")[0],
      });
      notify.success("Transaction voided.");
      setRows((prev) =>
        prev.filter(
          (r) =>
            !(r.transType === deleteTarget.transType && r.number === deleteTarget.number)
        )
      );
      setDeleteTarget(null);
      if (selectedAccount && fromDate && toDate) {
        void handleShow();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to void transaction. Please try again.";
      setDeleteError(message);
      throw error;
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="General Ledger Inquiry" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "General Ledger Inquiry" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {/* First row */}
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Account"
              value={selectedAccount}
              size="small"
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                setOpenAccountSelect(false);
            }}
              SelectProps={{
                open: openAccountSelect,
                onOpen: () => setOpenAccountSelect(true),
                onClose: () => setOpenAccountSelect(false),
                renderValue: (value: any) => {
                  if (!value) return "All accounts";
                  const found = (chartMasters as any[]).find((c: any) => String(c.account_code) === String(value));
                  return found ? `${found.account_name} - ${found.account_code}` : String(value);
                },
              }}
            >
              <MenuItem value="" onClick={() => {
                setSelectedAccount("");
                setOpenAccountSelect(false);
              }}>
                All accounts
              </MenuItem>
              {Object.entries(groupedChartMasters).map(([typeText, accounts]) => (
                <React.Fragment key={typeText}>
                  <ListSubheader>{typeText}</ListSubheader>
                  {accounts.map((acc: any) => (
                    <MenuItem
                      key={String(acc.account_code)}
                      value={String(acc.account_code)}
                      onClick={() => {
                        setSelectedAccount(String(acc.account_code));
                        setOpenAccountSelect(false);
                      }}
                    >
                      {acc.account_name} {acc.account_code ? ` - ${acc.account_code}` : ""}
                    </MenuItem>
                  ))}
                </React.Fragment>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <DimensionSelect
              label="Dimension"
              value={dimension}
              onChange={setDimension}
              emptyLabel="All dimensions"
            />
          </Grid>

          {/* Second row */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Amount min"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Amount max"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={handleShow}
              disabled={isLoading}
              sx={{ height: '40px', width: '100%' }}
            >
              {isLoading ? "Loading..." : "Show"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {summary && selectedAccount && (
        <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#e8f5e9" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Opening balance
              </Typography>
              <Typography variant="h6">{formatAccountingAmount(summary.opening_balance)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Period debit
              </Typography>
              <Typography variant="h6">{formatAccountingAmount(summary.period_debit)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Period credit
              </Typography>
              <Typography variant="h6">{formatAccountingAmount(summary.period_credit)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Period movement
              </Typography>
              <Typography variant="h6">{formatAccountingAmount(summary.period_movement)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Closing balance
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatAccountingAmount(summary.closing_balance)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Dimension</TableCell>
              <TableCell>Person/Item</TableCell>
              <TableCell>Debit</TableCell>
              <TableCell>Credit</TableCell>
              <TableCell>Memo</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.number}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.account}</TableCell>
                <TableCell>{r.dimension}</TableCell>
                <TableCell>{r.personItem}</TableCell>
                <TableCell>{r.debit}</TableCell>
                <TableCell>{r.credit}</TableCell>
                <TableCell>{r.memo}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    disabled={!r.transType || !r.number}
                    onClick={() => handleDeleteClick(r)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={11}
                count={rows.length}
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

      <DeleteConfirmationModal
        open={!!deleteTarget}
        title="Void transaction"
        content={
          deleteTarget ? (
            <>
              <Typography>
                Void <strong>{deleteTarget.type}</strong> #{deleteTarget.number}
                {deleteTarget.reference ? ` (${deleteTarget.reference})` : ""}? All GL lines for
                this transaction will be reversed.
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary" }}>
                The original transaction is marked void in the audit trail; GL is reversed, not
                hard-deleted.
              </Typography>
              {deleteError ? (
                <Typography sx={{ mt: 1, color: "error.main" }}>{deleteError}</Typography>
              ) : null}
            </>
          ) : null
        }
        handleClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        handleReject={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        deleteFunc={confirmDelete}
        customDeleteButtonText="Void"
      />
    </Stack>
  );
}

