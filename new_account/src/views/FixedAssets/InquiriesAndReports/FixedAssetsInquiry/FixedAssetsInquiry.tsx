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
  Checkbox,
  FormControlLabel,
  TablePagination,
  useMediaQuery,
  Theme,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { searchFixedAssets } from "../../../../api/FixedAssetsInquiry/FixedAssetsInquiryApi";

interface FaRow {
  id: string;
  class: string;
  uom: string;
  description: string;
  rate: number;
  method: string;
  status: string;
  purchased: string;
  initial: number;
  depreciations: number;
  current: number;
  liquidation: string;
}

export default function FixedAssetsInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [showInactive, setShowInactive] = useState(false);
  const [rows, setRows] = useState<FaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchFixedAssets({ showInactive });
      setRows(
        (data || []).map((r: any) => ({
          id: r.id ?? r.stock_id ?? "",
          class: r.class ?? "",
          uom: r.uom ?? "",
          description: r.description ?? "",
          rate: Number(r.rate) || 0,
          method: r.method ?? "",
          status: r.status ?? "",
          purchased: r.purchased ?? "",
          initial: Number(r.initial) || 0,
          depreciations: Number(r.depreciations) || 0,
          current: Number(r.current) || 0,
          liquidation: r.liquidation ?? "-",
        }))
      );
      setPage(0);
      setSearched(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Fixed assets inquiry failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRows = React.useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

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
          <PageTitle title="Fixed Assets Inquiry" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Inquiries and Reports", href: "/fixedassets/inquiriesandreports" },
              { title: "Fixed Assets Inquiry" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Checkbox checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            }
            label="Show Inactive"
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {searched && !loading && rows.length === 0 && !error && (
        <Alert severity="info">No fixed assets found. Register assets under Fixed Assets maintenance (item type Fixed Asset).</Alert>
      )}

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>UOM</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Purchased</TableCell>
              <TableCell align="right">Initial</TableCell>
              <TableCell align="right">Depreciation</TableCell>
              <TableCell align="right">Book value</TableCell>
              <TableCell>Liquidation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.class}</TableCell>
                <TableCell>{r.uom}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.rate}</TableCell>
                <TableCell>{r.method}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.purchased}</TableCell>
                <TableCell align="right">{r.initial.toFixed(2)}</TableCell>
                <TableCell align="right">{r.depreciations.toFixed(2)}</TableCell>
                <TableCell align="right">{r.current.toFixed(2)}</TableCell>
                <TableCell>{r.liquidation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Table>
      </TableContainer>
    </Stack>
  );
}
