import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useEffect, useState } from "react";
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
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  Theme,
  TableFooter,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import { searchCostCenters, CostCenterRecord } from "../../../../api/CostCenter/CostCenterApi";

interface Row {
  id: number;
  reference: string;
  name: string;
  type: string;
  date: string;
  dueDate: string;
  closed: string;
  balance: string;
}

function mapRow(d: CostCenterRecord): Row {
  return {
    id: d.id,
    reference: d.reference || "",
    name: d.name || "",
    type: String(d.type),
    date: d.start_date ? String(d.start_date).split("T")[0] : "",
    dueDate: d.date_required_by ? String(d.date_required_by).split("T")[0] : "",
    closed: d.closed ? "Yes" : "No",
    balance: Number(d.balance ?? 0).toFixed(2),
  };
}

export default function CostCenterInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [reference, setReference] = useState("");
  const [type, setType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await searchCostCenters({
        reference: reference || undefined,
        type: type || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        onlyOverdue: onlyOverdue || undefined,
        onlyOpen: onlyOpen || undefined,
      });
      setRows(data.map(mapRow));
      setPage(0);
    } catch (error) {
      console.error("CostCenter inquiry search failed:", error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void handleSearch();
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

  return (
    <FormPageLayout>
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
          <PageTitle title="Search CostCenters" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Home", href: "/dashboard" },
              { title: "CostCenters", href: "/costCenter/inquiriesandreports" },
              { title: "CostCenter Inquiry" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
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
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">CostCenter 1</MenuItem>
              <MenuItem value="2">CostCenter 2</MenuItem>
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
            <FormControlLabel
              control={<Checkbox checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />}
              label="Only Overdue"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={<Checkbox checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />}
              label="Only Open"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading}
              sx={{ height: "40px", width: "100%" }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : "Search"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Closed</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No costCenters found. Run a search or add a costCenter entry.
                </TableCell>
              </TableRow>
            )}
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.type === "2" ? "CostCenter 2" : "CostCenter 1"}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.dueDate}</TableCell>
                <TableCell>{r.closed}</TableCell>
                <TableCell align="right">{r.balance}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() =>
                        navigate(`/costCenter/inquiriesandreports/view-costCenter/${r.id}`)
                      }
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() =>
                        navigate(`/costCenter/transactions/edit-costCenter-entry/${r.id}`)
                      }
                    >
                      Edit
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
                colSpan={9}
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
    </FormPageLayout>
  );
}
