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
  Grid,
  useMediaQuery,
  Theme,
  TableFooter,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import api from "../../../../api/apiClient";

interface Row {
  id: number;
  type: string;
  description: string;
  amount: string;
  outputsInputs: string;
}

export default function TaxInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search form state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleShow = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/tax-inquiry/search", {
        fromDate,
        toDate,
      });

      const transformedRows: Row[] = response.data.map((item: any, index: number) => ({
        id: index,
        type: item.type || "",
        description: item.description || "",
        amount: item.amount?.toString() || "0",
        outputsInputs: item.outputsInputs?.toString() || "0",
      }));

      setRows(transformedRows);
      setPage(0);
    } catch (error: any) {
      console.error("Tax inquiry search failed:", error);
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

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Tax Inquiry" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Tax Inquiry" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Outputs/Inputs</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.amount}</TableCell>
                <TableCell>{r.outputsInputs}</TableCell>
              </TableRow>
            ))}

            {/* Total Row */}
            <TableRow sx={{ backgroundColor: "#f5f5f5", borderTop: "2px solid #e0e0e0" }}>
              <TableCell></TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Total payable or refund:
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                {rows.reduce((sum, r) => sum + (parseFloat(r.outputsInputs) || 0), 0).toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={4}
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
    </Stack>
  );
}
