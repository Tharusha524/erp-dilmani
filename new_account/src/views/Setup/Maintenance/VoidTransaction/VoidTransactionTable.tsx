import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Box,
  Button,
  Stack,
  TableFooter,
  TablePagination,
  Typography,
  useMediaQuery,
  Theme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import {
  getVoidTransactionOptions,
  type VoidTransactionOption,
} from "../../../../api/VoidTransaction/VoidTransactionApi";
import FormattedNumberField from "../../../../components/FormattedNumberField";

function formatDate(value?: string): string {
  if (!value) return "—";
  return String(value).split("T")[0];
}

export default function VoidTransactionTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactionType, setTransactionType] = useState("");
  const [fromRef, setFromRef] = useState("");
  const [toRef, setToRef] = useState("");

  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const { data: transactions = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["void-transaction-options"],
    queryFn: () => getVoidTransactionOptions(),
  });

  const typeOptions = useMemo(() => {
    const map = new Map<number, string>();
    transactions.forEach((t) => {
      if (!map.has(t.trans_type)) {
        map.set(t.trans_type, t.type_name ?? t.label);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [transactions]);

  const filteredData = useMemo(() => {
    let data: VoidTransactionOption[] = [...transactions];

    if (transactionType !== "") {
      data = data.filter((t) => String(t.trans_type) === transactionType);
    }
    if (fromRef.trim() !== "") {
      const from = parseInt(fromRef, 10);
      if (!Number.isNaN(from)) {
        data = data.filter((t) => t.trans_no >= from);
      }
    }
    if (toRef.trim() !== "") {
      const to = parseInt(toRef, 10);
      if (!Number.isNaN(to)) {
        data = data.filter((t) => t.trans_no <= to);
      }
    }

    return data;
  }, [transactions, transactionType, fromRef, toRef]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredData]);

  const handleVoidSelected = (row: VoidTransactionOption) => {
    navigate("/setup/maintenance/add-void-a-transaction", {
      state: { transactionKey: `${row.trans_type}:${row.trans_no}` },
    });
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Setup", href: "/setup/maintenance" },
    { title: "Void Transactions" },
  ];

  return (
    <Stack>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          overflowX: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Void Transactions" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/setup/maintenance/add-void-a-transaction")}
          >
            Void a Transaction
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/setup/maintenance")}
          >
            Back
          </Button>
        </Stack>
      </Box>

      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{
          px: 2,
          mb: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Transaction Type</InputLabel>
          <Select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setPage(0);
            }}
            label="Transaction Type"
          >
            <MenuItem value="">All</MenuItem>
            {typeOptions.map(([type, name]) => (
              <MenuItem key={type} value={String(type)}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormattedNumberField
          label="From #"
          size="small"
          value={fromRef}
          onChange={(e) => {
            setFromRef(e.target.value);
            setPage(0);
          }}
          sx={{ width: 120 }}
        />

        <FormattedNumberField
          label="To #"
          size="small"
          value={toRef}
          onChange={(e) => {
            setToRef(e.target.value);
            setPage(0);
          }}
          sx={{ width: 120 }}
        />

        <Button variant="outlined" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Loading…" : "Refresh"}
        </Button>
      </Stack>

      <Stack sx={{ alignItems: "center", px: 2, pb: 2 }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            overflowX: "auto",
            maxWidth: isMobile ? "88vw" : "100%",
            width: "100%",
          }}
        >
          <Table aria-label="void transactions table" size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Transaction</TableCell>
                <TableCell align="center">Select</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={28} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((tx) => (
                  <TableRow key={`${tx.trans_type}-${tx.trans_no}`} hover>
                    <TableCell>{tx.trans_no}</TableCell>
                    <TableCell>{tx.reference || "—"}</TableCell>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.type_name ?? tx.label}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Void this transaction">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleVoidSelected(tx)}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      No posted transactions found. Post invoices, payments, journals, etc. first.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, { label: "All", value: -1 }]}
                  colSpan={5}
                  count={filteredData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  showFirstButton
                  showLastButton
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  );
}
