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
  Paper,
  TextField,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  FormControl,
  InputLabel,
  Select,
  TableFooter,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import { getUsers } from "../../../../api/UserManagement/userManagement";
import { deleteJournalTransaction } from "../../../../api/Journals/JournalApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import DeleteConfirmationModal from "../../../../components/DeleteConfirmationModal";
import theme from "../../../../theme";
import api from "../../../../api/apiClient";
import { notify } from "../../../../services/notificationService";

interface Row {
  id: string;
  date: string;
  type: string;
  transNumber: string;
  transType: string;
  counterparty: string;
  reference: string;
  amount: string;
  memo: string;
  user: string;
  debtorNo?: string | number;
  supplierId?: string | number;
}

function getJournalEditTarget(row: Row): { path: string; state: Record<string, unknown> } | null {
  const transNo = Number(row.transNumber);
  const editState = {
    trans_no: transNo,
    reference: row.reference,
    date: row.date,
    debtor_no: row.debtorNo,
    supplier_id: row.supplierId,
  };

  switch (String(row.transType)) {
    case "0":
      return {
        path: "/bankingandgeneralledger/transactions/journal-entry",
        state: { ...editState, trans_type: 0, edit: true },
      };
    case "1":
      return {
        path: "/bankingandgeneralledger/transactions/payments",
        state: { ...editState, trans_type: 1, edit: true },
      };
    case "2":
      return {
        path: "/bankingandgeneralledger/transactions/deposits",
        state: { ...editState, trans_type: 2, edit: true },
      };
    case "4":
      return {
        path: "/bankingandgeneralledger/transactions/bank-account-transfers",
        state: { ...editState, trans_type: 4, edit: true },
      };
    case "10":
      return {
        path: "/sales/inquiriesandreports/customer-transaction-inquiry/update-customer-invoice/",
        state: editState,
      };
    case "11":
      return {
        path: "/sales/transactions/update-customer-credit-notes/",
        state: editState,
      };
    case "12":
      return {
        path: "/sales/transactions/update-customer-payments/",
        state: editState,
      };
    case "13":
      return {
        path: "/sales/transactions/update-customer-delivery/",
        state: editState,
      };
    case "20":
      return {
        path: "/bankingandgeneralledger/inquiriesandreports/journal-inquiry/modify-purchase-invoice",
        state: editState,
      };
    case "21":
      return {
        path: "/purchase/transactions/supplier-credit-notes",
        state: { ...editState, supplier: row.supplierId },
      };
    case "22":
      return {
        path: "/bankingandgeneralledger/inquiriesandreports/journal-inquiry/Customer-payment-entry",
        state: editState,
      };
  }

  return null;
}

export default function JournalInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // API calls
  const { data: transTypes = [] } = useQuery({ queryKey: ["transTypes"], queryFn: getTransTypes });
  const { data: usersData = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const data = await getUsers();
      return data.map((user: any) => ({
        id: user.id,
        fullName: `${user.first_name} ${user.last_name}`,
        department: user.department,
        email: user.email,
        role: user.role,
        status: user.status,
      }));
    },
  });

  // Search form state
  const [reference, setReference] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [unpostedOnly, setUnpostedOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/journals/search", {
        reference,
        type: selectedType || null,
        fromDate,
        toDate,
        memo,
        userId: selectedUser || null,
        isPosted: unpostedOnly ? false : null,
      });

      // Map backend response to Row format
      const transformedRows: Row[] = response.data.map((item: any) => {
        const transType = (transTypes as any[]).find((t: any) =>
          String(t.trans_type ?? t.id) === String(item.trans_type)
        );
        const user = (usersData as any[]).find((u: any) => u.id === item.user_id);

        return {
          id: `${item.trans_no}-${item.trans_type}`,
          date: item.tran_date || "",
          type: transType?.description || item.trans_type || "",
          transNumber: item.trans_no,
          transType: String(item.trans_type ?? ""),
          counterparty: item.supp_reference || item.reference || "",
          reference: item.reference || item.supp_reference || "",
          amount: item.amount ? parseFloat(item.amount).toFixed(2) : "0.00",
          memo: item.memo || "",
          user: user?.fullName || item.user_id || "",
          debtorNo: item.debtor_no || undefined,
          supplierId: item.supplier_id || undefined,
        };
      });

      setRows(transformedRows);
      setPage(0);
    } catch (error: any) {
      console.error("Search failed:", error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedRows = React.useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (row: Row) => {
    const target = getJournalEditTarget(row);
    if (!target) {
      notify.warning(`Edit is not available for transaction type "${row.type}".`);
      return;
    }
    navigate(target.path, { state: target.state });
  };

  const handleDeleteClick = (row: Row) => {
    setDeleteError("");
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJournalTransaction(deleteTarget.transType, deleteTarget.transNumber, {
        void_date: new Date().toISOString().split("T")[0],
      });
      notify.success("Transaction voided.");
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to delete transaction. Please try again.";
      setDeleteError(message);
      throw error;
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Journal Inquiry" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Journal Inquiry" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {/* First row */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(String(e.target.value))}
              >
                <MenuItem value="">All Types</MenuItem>
                {(transTypes as any[]).map((t: any) => (
                  <MenuItem key={String(t.trans_type ?? t.id ?? t.code)} value={String(t.trans_type ?? t.id ?? t.code)}>
                    {t.description ?? t.name ?? t.label ?? String(t.trans_type ?? t.id ?? t.code)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <FormControl fullWidth size="small">
              <InputLabel>User</InputLabel>
              <Select
                value={selectedUser}
                label="User"
                onChange={(e) => setSelectedUser(String(e.target.value))}
              >
                <MenuItem value="">All Users</MenuItem>
                {usersData.map((u: any) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={unpostedOnly}
                  onChange={(e) => setUnpostedOnly(e.target.checked)}
                />
              }
              label="Unposted only"
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={isLoading}
              sx={{ height: '40px', width: '100%' }}
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Trans #</TableCell>
              <TableCell>Counterparty</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Memo</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="center">View</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.transNumber}</TableCell>
                <TableCell>{r.counterparty}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.amount}</TableCell>
                <TableCell>{r.memo}</TableCell>
                <TableCell>{r.user}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      navigate("/bankingandgeneralledger/transactions/gl-postings", {
                        state: {
                          trans_no: Number(r.transNumber),
                          trans_type: Number(r.transType),
                          reference: r.reference,
                          date: r.date,
                        },
                      })
                    }
                  >
                    GL
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button variant="outlined" size="small" onClick={() => handleEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(r)}
                    >
                      Void
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={10}
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
                Void <strong>{deleteTarget.type}</strong> #{deleteTarget.transNumber}
                {deleteTarget.reference ? ` (${deleteTarget.reference})` : ""}? Reversing GL entries
                will be posted (FrontAccounting void).
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary" }}>
                Original transaction is marked void in audit trail; GL is reversed, not hard-deleted.
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
      />
    </Stack>
  );
}
