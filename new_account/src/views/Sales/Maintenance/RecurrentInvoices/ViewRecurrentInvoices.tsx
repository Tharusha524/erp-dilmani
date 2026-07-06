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
} from "@mui/material";
import { useMemo, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import SearchBar from "../../../../components/SearchBar";
import { getRecurrentInvoices, deleteRecurrentInvoice } from "../../../../api/RecurrentInvoice/RecurrentInvoiceApi";
import { getSalesGroups } from "../../../../api/SalesMaintenance/salesService";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getSalesOrders } from "../../../../api/SalesOrders/SalesOrdersApi";
import DeleteConfirmationModal from "../../../../components/DeleteConfirmationModal";
import ErrorModal from "../../../../components/ErrorModal";

function ViewRecurrentInvoices() {

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recurrentInvoices = [] } = useQuery({
    queryKey: ["recurrentInvoices"],
    queryFn: getRecurrentInvoices,
    refetchOnMount: true,
  });

  const { data: salesGroups = [] } = useQuery({
    queryKey: ["salesGroups"],
    queryFn: getSalesGroups,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: getSalesOrders,
    refetchOnMount: true,
    staleTime: 0,
  });

  const filteredInvoices = useMemo(() => {
    if (!recurrentInvoices) return [];

    let filtered = recurrentInvoices;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((invoice) =>
        invoice.description.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [recurrentInvoices, searchQuery]);

  const templateOrders = useMemo(() => {
    return (salesOrders || []).filter((order: any) => order.type === 1);
  }, [salesOrders]);

  const hasTemplateOrders = templateOrders.length > 0;

  const paginatedInvoices = useMemo(() => {
    if (rowsPerPage === -1) return filteredInvoices;
    return filteredInvoices.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredInvoices, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedAreaId) return;

    try {
      await deleteRecurrentInvoice(selectedAreaId);
      queryClient.invalidateQueries({ queryKey: ["recurrentInvoices"] });
    } catch (error) {
      console.error("Failed to delete Recurrent Invoice:", error);
      setErrorMessage(
        error?.response?.data?.message ||
        "Failed to delete Recurrent Invoice Please try again."
      );
      setErrorOpen(true);
    } finally {
      setOpenDeleteModal(false);
      setSelectedAreaId(null);
    }
  };


  const breadcrumbItems = [
    { title: "Maintenance", href: "/sales/maintenance/" },
    { title: "Recurrent Invoices" },
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
          <PageTitle title="Recurrent Invoices" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/sales/maintenance/add-recurrent-invoice")}
            disabled={!hasTemplateOrders}
          >
            Add Recurrent Invoice
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/sales/maintenance")}
          >
            Back
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          px: 2,
          mb: 2,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: isMobile ? "100%" : "300px" }}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search..."
          />
        </Box>
      </Box>

      <Stack sx={{ alignItems: "center" }}>
        {!hasTemplateOrders ? (
          <Paper
            elevation={2}
            sx={{
              p: theme.spacing(4),
              maxWidth: "600px",
              width: "100%",
              textAlign: "center",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7"
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No Template Orders Available
            </Typography>
            <Typography variant="body1">
              There is no template order in database. You have to create at least one sales order marked as template to be able to define recurrent invoices.
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
          >
          <Table aria-label="recurrent invoice table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Template No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Branch/Group</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Monthly</TableCell>
                <TableCell>Begin</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Last Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>{invoice.order_no}</TableCell>
                    <TableCell>{customers.find(c => c.debtor_no === invoice.debtor_no)?.name || (invoice.debtor_no ? invoice.debtor_no : '')}</TableCell>
                    <TableCell>{salesGroups.find(g => g.id === invoice.group_no)?.name || invoice.group_no}</TableCell>
                    <TableCell>{invoice.days}</TableCell>
                    <TableCell>{invoice.monthly}</TableCell>
                    <TableCell>{invoice.begin ? new Date(invoice.begin).toISOString().split('T')[0] : ''}</TableCell>
                    <TableCell>{invoice.end ? new Date(invoice.end).toISOString().split('T')[0] : ''}</TableCell>
                    <TableCell>{invoice.last_sent ? new Date(invoice.last_sent).toISOString().split('T')[0] : ''}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() =>
                            navigate(`/sales/maintenance/update-recurrent-invoice/${invoice.id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setSelectedAreaId(invoice.id);
                            setOpenDeleteModal(true);
                          }}
                        >
                          Delete
                        </Button>

                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={10}
                  count={filteredInvoices.length}
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
        )}
      </Stack>
      <DeleteConfirmationModal
        open={openDeleteModal}
        title="Delete Recurrent Invoice"
        content="Are you sure you want to delete this Recurrent Invoice? This action cannot be undone."
        handleClose={() => setOpenDeleteModal(false)}
        handleReject={() => setSelectedAreaId(null)}
        deleteFunc={handleDelete}
        onSuccess={() => console.log("Recurrent Invoice deleted successfully!")}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}

export default ViewRecurrentInvoices;
