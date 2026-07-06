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
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import DatePickerComponent from "../../../../../components/DatePickerComponent";
import { getSupplierTransactionsInquiry } from "../../../../../api/Purchases/PurchasesApi";

interface SupplierTransactionProps {
  supplierId?: string | number;
}

const TRANS_TYPE_LABELS: Record<number, string> = {
  20: "Invoice",
  21: "Credit Note",
  22: "Payment",
};

export default function SuppliersTransactionsTable({ supplierId }: SupplierTransactionProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    type: "",
    fromDate: null as Date | null,
    toDate: null as Date | null,
  });

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const navigate = useNavigate();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["supplierTransactionsInquiry", supplierId],
    queryFn: () =>
      getSupplierTransactionsInquiry({
        supplier_id: supplierId ? Number(supplierId) : undefined,
        limit: 500,
      }),
    enabled: Boolean(supplierId),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFilters({ ...filters, [name]: date });
  };

  const mappedRows = useMemo(() => {
    return (transactions as any[]).map((txn) => ({
      id: `${txn.trans_type}-${txn.trans_no}`,
      type: TRANS_TYPE_LABELS[Number(txn.trans_type)] ?? String(txn.trans_type ?? ""),
      number: txn.trans_no,
      reference: txn.reference ?? "",
      supplier: txn.supplier_id,
      supplierReference: txn.supp_reference ?? "",
      date: txn.trans_date ?? "",
      dueDate: txn.due_date ?? txn.trans_date ?? "",
      amount: Number(txn.ov_amount ?? 0) + Number(txn.ov_gst ?? 0),
      currency: "",
      terms: "",
      current: 0,
      days1to30: 0,
      days31to60: 0,
      over60: 0,
      totalBalance: Number(txn.ov_amount ?? 0) - Number(txn.alloc ?? 0),
    }));
  }, [transactions]);

  const filteredData = useMemo(() => {
    return mappedRows.filter((txn) => {
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
  }, [mappedRows, filters]);

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

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/purchase/maintenance/suppliers")}
          >
            Back
          </Button>
        </Stack>
      </Box>

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
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">From Date:</Typography>
          <DatePickerComponent
            label=""
            value={filters.fromDate}
            onChange={(date) => handleDateChange("fromDate", date)}
          />
        </Stack>
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
                <TableCell>Type</TableCell>
                <TableCell>#</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Supplier's Reference</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2">Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>{txn.type}</TableCell>
                    <TableCell>{txn.number}</TableCell>
                    <TableCell>{txn.reference}</TableCell>
                    <TableCell>{txn.supplier}</TableCell>
                    <TableCell>{txn.supplierReference}</TableCell>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>{txn.dueDate}</TableCell>
                    <TableCell>{txn.amount}</TableCell>
                    <TableCell>{txn.totalBalance}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={9}
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
