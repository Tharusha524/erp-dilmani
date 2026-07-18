import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

// Mock API
const getViewPrintTransactions = async () => [
  {
    id: 1,
    reference: "INV-2001",
    date: "2025-09-05",
    gl: "Sales GL",
    transactionType: "Invoice",
  },
  {
    id: 2,
    reference: "PAY-302",
    date: "2025-09-07",
    gl: "Cash GL",
    transactionType: "Payment",
  },
];

export default function ViewPrintTransactions() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionType, setTransactionType] = useState("");
  const [fromRef, setFromRef] = useState("");
  const [toRef, setToRef] = useState("");
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    getViewPrintTransactions().then((data) => setTransactions(data));
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...transactions];

    if (transactionType.trim() !== "") {
      data = data.filter((t) => t.transactionType === transactionType);
    }
    if (fromRef.trim() !== "") {
      data = data.filter((t) => t.id >= parseInt(fromRef));
    }
    if (toRef.trim() !== "") {
      data = data.filter((t) => t.id <= parseInt(toRef));
    }

    return data;
  }, [transactions, transactionType, fromRef, toRef]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [page, rowsPerPage, filteredData]);

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "View / Print Transactions" },
  ];

  return (
    <FormPageLayout>
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
        }}
      >
        <Box>
          <PageTitle title="View / Print Transactions" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/setup/maintenance")}
          >
            Back
          </Button>
        </Stack>
      </Box>
      {/* Search Filters */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{
          px: 2,
          mb: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Transaction Type */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Transaction Type</InputLabel>
          <Select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            label="Transaction Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Invoice">Invoice</MenuItem>
            <MenuItem value="Payment">Payment</MenuItem>
          </Select>
        </FormControl>

        {/* From Ref */}
        <TextField
          label="From #"
          size="small"
          value={fromRef}
          onChange={(e) => setFromRef(e.target.value)}
        />

        {/* To Ref */}
        <TextField
          label="To #"
          size="small"
          value={toRef}
          onChange={(e) => setToRef(e.target.value)}
        />
      </Stack>
      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            overflowX: "auto",
            maxWidth: isMobile ? "88vw" : "100%",
          }}
        >
          <Table aria-label="view print transactions table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>GL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.reference}</TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.gl}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={4}
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
    </FormPageLayout>
  );
}
