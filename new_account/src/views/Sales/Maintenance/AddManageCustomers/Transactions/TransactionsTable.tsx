import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Paper,
  Typography,
  TextField,
  useMediaQuery,
  Theme,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import DatePickerComponent from "../../../../../components/DatePickerComponent";

interface TransactionsProps {
  customerId?: string | number;
}

// Mock API
const getTransactions = async () => [
  {
    id: 1,
    currency: "LKR",
    terms: "Net 30",
    current: 5000,
    days1to30: 2000,
    days31to60: 1000,
    over60: 500,
    totalBalance: 8500,
    type: "Invoice",
    number: "TXN001",
    order: "SO001",
    reference: "REF001",
    date: "2025-09-01",
    dueDate: "2025-09-30",
    branch: "Colombo",
    amount: 8500,
  },
  {
    id: 2,
    currency: "USD",
    terms: "Net 15",
    current: 10000,
    days1to30: 2500,
    days31to60: 500,
    over60: 0,
    totalBalance: 13000,
    type: "Payment",
    number: "TXN002",
    order: "SO002",
    reference: "REF002",
    date: "2025-09-05",
    dueDate: "2025-09-20",
    branch: "Kandy",
    amount: 13000,
  },
];

export default function TransactionsTable({ customerId }: TransactionsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    fromDate: null as Date | null,
    toDate: null as Date | null,
  });

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const navigate = useNavigate();

  // Fetch data
  useEffect(() => {
    getTransactions().then((data) => setTransactions(data));
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFilters({ ...filters, [name]: date });
  };

  // Filtered data
  const filteredData = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesType =
        !filters.type ||
        txn.type.toLowerCase().includes(filters.type.toLowerCase());

      const normalize = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const matchesFromDate =
        !filters.fromDate ||
        normalize(new Date(txn.date)) >= normalize(filters.fromDate) ||
        normalize(new Date(txn.dueDate)) >= normalize(filters.fromDate);

      const matchesToDate =
        !filters.toDate ||
        (normalize(new Date(txn.date)) <= normalize(filters.toDate) &&
          normalize(new Date(txn.dueDate)) <= normalize(filters.toDate));



      return matchesType && matchesFromDate && matchesToDate;
    });
  }, [transactions, filters]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_event: any, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Transactions" },
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
        }}
      >
        <Box>
          <PageTitle title="Transactions" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
      </Box>

      {/* Search & Filter */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{ px: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}
      >
        <TextField
          label="Type"
          name="type"
          size="small"
          value={filters.type}
          onChange={handleFilterChange}
        />

        {/* From Date */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">From Date:</Typography>
          <DatePickerComponent
            label=""
            value={filters.fromDate}
            onChange={(date) => handleDateChange("fromDate", date)}
          />
        </Stack>

        {/* To Date */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">To Date:</Typography>
          <DatePickerComponent
            label=""
            value={filters.toDate}
            onChange={(date) => handleDateChange("toDate", date)}
          />
        </Stack>
      </Stack>


      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
        >
          <Table aria-label="transactions table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Terms</TableCell>
                <TableCell>Current</TableCell>
                <TableCell>1-30 Days</TableCell>
                <TableCell>31-60 Days</TableCell>
                <TableCell>Over 60 Days</TableCell>
                <TableCell>Total Balance</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>#</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>{txn.currency}</TableCell>
                    <TableCell>{txn.terms}</TableCell>
                    <TableCell>{txn.current}</TableCell>
                    <TableCell>{txn.days1to30}</TableCell>
                    <TableCell>{txn.days31to60}</TableCell>
                    <TableCell>{txn.over60}</TableCell>
                    <TableCell>{txn.totalBalance}</TableCell>
                    <TableCell>{txn.type}</TableCell>
                    <TableCell>{txn.number}</TableCell>
                    <TableCell>{txn.order}</TableCell>
                    <TableCell>{txn.reference}</TableCell>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>{txn.dueDate}</TableCell>
                    <TableCell>{txn.branch}</TableCell>
                    <TableCell>{txn.amount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={15} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={15}
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
