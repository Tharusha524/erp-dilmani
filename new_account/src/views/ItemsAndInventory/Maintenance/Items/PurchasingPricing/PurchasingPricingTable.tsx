import { FormPageLayout } from "../../../../../components/Layout/FormPageLayout";
import React, { useState, useMemo, useEffect } from "react";
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
  TableFooter,
  TablePagination,
  Paper,
  Typography,
  useMediaQuery,
  Theme,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import theme from "../../../../../theme";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import SearchBar from "../../../../../components/SearchBar";
import { getPurchData, PurchData, deletePurchData } from "../../../../../api/PurchasingPricing/PurchasingPricingApi";
import { getSuppliers } from "../../../../../api/Supplier/SupplierApi";
import DeleteConfirmationModal from "../../../../../components/DeleteConfirmationModal";
import ErrorModal from "../../../../../components/ErrorModal";
import ItemUsdSupplierPricingPanel from "../../../../../components/ItemUsdSupplierPricingPanel";
interface ItemPurchasinPricingProps {
  itemId?: string | number;
}

interface Supplier {
  supplier_id: number;
  supp_name: string;
}

interface PurchasingPricing {
  supplier_id: number;
  stock_id: string;
  price: number;
  suppliers_uom: string;
  conversion_factor: number;
  supplier_description?: string;
  supplier_name?: string; // Added for display
}

function PurchasingPricingTable({ itemId }: ItemPurchasinPricingProps) {
  const [purchaseData, setPurchaseData] = useState<PurchasingPricing[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ supplierId: number; stockId: string } | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pricingRefreshKey, setPricingRefreshKey] = useState(0);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch purchasing pricing data
        const purchData = await getPurchData();

        // Fetch suppliers for name mapping
        const suppliersData = await getSuppliers();
        setSuppliers(suppliersData);

        // Filter by itemId if provided and map supplier names
        let filteredData = purchData;
        if (itemId) {
          filteredData = purchData.filter(item => item.stock_id === itemId.toString());
        }

        // Map supplier names
        const dataWithSupplierNames = filteredData.map(item => ({
          ...item,
          supplier_name: suppliersData.find(s => s.supplier_id === item.supplier_id)?.supp_name || 'Unknown Supplier'
        }));

        setPurchaseData(dataWithSupplierNames);
      } catch (error) {
        console.error("Failed to fetch purchasing pricing data:", error);
        setPurchaseData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, pricingRefreshKey]);

  // Filter by search
  const filteredData = useMemo(() => {
    return purchaseData.filter((item) => {
      return (
        (item.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier_description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suppliers_uom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.price.toString().includes(searchQuery) ||
        item.stock_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [purchaseData, searchQuery]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredData;
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (supplierId: number, stockId: string) => {
    setSelectedItem({ supplierId, stockId });
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    try {
      await deletePurchData(selectedItem.supplierId, selectedItem.stockId);
      // Refresh data after deletion
      const updatedData = await getPurchData();
      let filteredData = updatedData;
      if (itemId) {
        filteredData = updatedData.filter(item => item.stock_id === itemId.toString());
      }
      const dataWithSupplierNames = filteredData.map(item => ({
        ...item,
        supplier_name: suppliers.find(s => s.supplier_id === item.supplier_id)?.supp_name || 'Unknown Supplier'
      }));
      setPurchaseData(dataWithSupplierNames);
      setOpenDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to delete purchasing pricing:", error);
      setErrorMessage("Failed to delete the record. Please try again.");
      setErrorOpen(true);
      setOpenDeleteModal(false);
      setSelectedItem(null);
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Purchasing Pricing" },
  ];

  return (
    <FormPageLayout>
      {/* Header */}
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <PageTitle title="Purchasing Pricing" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(`/itemsandinventory/maintenance/items/add-purchasing-pricing/${itemId}`)
            }
          >
            Add Purchasing Pricing
          </Button>
        </Stack>
      </Box>
      {itemId ? (
        <Box sx={{ px: 2 }}>
          <ItemUsdSupplierPricingPanel
            stockId={String(itemId)}
            onSaved={() => setPricingRefreshKey((k) => k + 1)}
          />
        </Box>
      ) : null}
      {/* Search */}
      <Stack
        direction="row"
        sx={{ px: 2, mb: 2, width: "100%", justifyContent: "flex-end" }}
      >
        <Box sx={{ width: isMobile ? "100%" : "300px" }}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search Supplier, Description, UOM, Price or Stock ID..."
          />
        </Box>
      </Stack>
      {/* Table */}
      <Stack sx={{ alignItems: "center" }}>
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
        >
          <Table aria-label="purchasing pricing table">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Supplier's Unit</TableCell>
                <TableCell>Conversion Factor</TableCell>
                <TableCell>Supplier's Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <TableRow key={`${item.supplier_id}-${item.stock_id}`} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.supplier_name}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>USD</TableCell>
                    <TableCell>{item.suppliers_uom}</TableCell>
                    <TableCell>{item.conversion_factor}</TableCell>
                    <TableCell>{item.supplier_description || ''}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() =>
                            navigate(
                              `/itemsandinventory/maintenance/items/update-purchasing-pricing/${item.supplier_id}/${item.stock_id}`
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(item.supplier_id, item.stock_id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2">No Records Found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={8}
                  count={filteredData.length}
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
      <DeleteConfirmationModal
        open={openDeleteModal}
        title="Delete Purchasing Pricing"
        content="Are you sure you want to delete this purchasing pricing entry? This action cannot be undone."
        handleClose={() => setOpenDeleteModal(false)}
        handleReject={() => setOpenDeleteModal(false)}
        deleteFunc={handleDeleteConfirm}
        onSuccess={() => { }}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </FormPageLayout>
  );
}

export default PurchasingPricingTable;
