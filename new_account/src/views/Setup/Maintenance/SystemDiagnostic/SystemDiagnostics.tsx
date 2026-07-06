import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import SearchBar from "../../../../components/SearchBar";
import theme from "../../../../theme";
import { useNavigate } from "react-router";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  DiagnosticLine,
  DiagnosticStatus,
  getSystemDiagnostics,
} from "../../../../api/SystemDiagnostics/SystemDiagnosticsApi";

const statusColor: Record<DiagnosticStatus, "success" | "warning" | "error"> = {
  ok: "success",
  warning: "warning",
  error: "error",
};

const statusLabel: Record<DiagnosticStatus, string> = {
  ok: "OK",
  warning: "Warning",
  error: "Error",
};

export default function SystemDiagnostics() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["systemDiagnostics"],
    queryFn: getSystemDiagnostics,
  });

  const diagnostics: DiagnosticLine[] = data?.lines ?? [];

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return diagnostics;
    const lower = searchQuery.toLowerCase();
    return diagnostics.filter(
      (d) =>
        d.test.toLowerCase().includes(lower) ||
        d.test_type.toLowerCase().includes(lower) ||
        d.value.toLowerCase().includes(lower) ||
        d.comments.toLowerCase().includes(lower) ||
        d.status.toLowerCase().includes(lower) ||
        d.id.toString().includes(lower)
    );
  }, [diagnostics, searchQuery]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) =>
    setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Setup", href: "/setup/maintenance" },
    { title: "System Diagnostics" },
  ];

  const summary = data?.summary;
  const hasErrors = (summary?.error ?? 0) > 0;
  const hasWarnings = (summary?.warning ?? 0) > 0;

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
          <PageTitle title="System Diagnostics" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={isFetching ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Run diagnostics
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

      {error && (
        <Alert severity="error" sx={{ mx: 2 }}>
          Could not load diagnostics. Ensure Laravel is running on port 8000 and you are logged in.
          {(error as { response?: { data?: { message?: string } } })?.response?.data?.message && (
            <> {" "}
              ({(error as { response?: { data?: { message?: string } } }).response?.data?.message})
            </>
          )}
        </Alert>
      )}

      {summary && !isLoading && (
        <Stack direction="row" spacing={1} sx={{ px: 2, mb: 1, flexWrap: "wrap" }}>
          <Chip label={`${summary.ok} OK`} color="success" variant="outlined" />
          <Chip label={`${summary.warning} Warning`} color="warning" variant="outlined" />
          <Chip label={`${summary.error} Error`} color="error" variant="outlined" />
          {data?.ran_at && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", ml: 1 }}>
              Last run: {new Date(data.ran_at).toLocaleString()}
            </Typography>
          )}
        </Stack>
      )}

      {!isLoading && summary && (
        <Box sx={{ px: 2, mb: 1 }}>
          {hasErrors ? (
            <Alert severity="error">
              {summary.error} critical issue(s) found. Review errors below and correct setup or data.
            </Alert>
          ) : hasWarnings ? (
            <Alert severity="warning">
              {summary.warning} warning(s) found. The system may run with limitations until these are resolved.
            </Alert>
          ) : (
            <Alert severity="success">All {summary.total} diagnostic checks passed.</Alert>
          )}
        </Box>
      )}

      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{ px: 2, mb: 2, alignItems: "center", justifyContent: "flex-end" }}
      >
        <Box sx={{ width: isMobile ? "100%" : "300px" }}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search diagnostics"
          />
        </Box>
      </Stack>

      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
        >
          <Table aria-label="system diagnostics table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Test</TableCell>
                <TableCell>Test type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Comments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={32} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.test}</TableCell>
                    <TableCell>{d.test_type}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel[d.status]}
                        color={statusColor[d.status]}
                      />
                    </TableCell>
                    <TableCell>{d.value}</TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>{d.comments}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2">No records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={6}
                  count={filteredData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  showFirstButton
                  showLastButton
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  );
}
