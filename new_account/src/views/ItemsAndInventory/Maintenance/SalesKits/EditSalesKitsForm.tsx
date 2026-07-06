import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemCodes, createItemCode, updateItemCode, deleteItemCode } from "../../../../api/ItemCodes/ItemCodesApi";
import { getFriendlyApiErrorMessage } from "../../../../utils/apiErrorMessage";
import { resolveStockId } from "../../../../utils/itemCodePayload";
import queryClient from "../../../../state/queryClient";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../../../../theme";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import UpdateConfirmationModal from "../../../../components/UpdateConfirmationModal"
import ErrorModal from "../../../../components/ErrorModal";

interface EditQuantityData {
  id: string;
  quantity: string;
}

export default function EditSalesKitsForm() {
  const [selectedKit, setSelectedKit] = useState<string>("");
  const [selectedKitCode, setSelectedKitCode] = useState<string>("");
  const [formData, setFormData] = useState({
    description: "",
    category: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [errors, setErrors] = useState<Partial<{ selectedKit: string; description: string; category: string; }>>({});
  const [addComponentData, setAddComponentData] = useState({
    component: "",
    quantity: "",
  });
  const [addErrors, setAddErrors] = useState<Partial<typeof addComponentData>>({});
  const [editQuantityDialog, setEditQuantityDialog] = useState(false);
  const [editQuantityData, setEditQuantityData] = useState<EditQuantityData>({ id: "", quantity: "" });

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch existing sales kits (item_codes where is_foreign=0)
  const { data: existingKitsData = [], isLoading: kitsLoading } = useQuery({
    queryKey: ["item-codes"],
    queryFn: () => getItemCodes(),
  });
  const existingKits = (existingKitsData && (existingKitsData.data ?? existingKitsData)) ?? [];
  const salesKits = existingKits.filter((kit: any) => kit.is_foreign === 0 || !kit.is_foreign);

  // Fetch items for components
  const { data: itemsData = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => getItems(),
  });
  const items = (itemsData && (itemsData.data ?? itemsData)) ?? [];

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["item-categories"],
    queryFn: () => getItemCategories(),
  });
  const categories = (categoriesData && (categoriesData.data ?? categoriesData)) ?? [];

  // Get components for selected kit
  const kitComponents = selectedKitCode
    ? existingKits.filter((code: any) => code.item_code === selectedKitCode && code.stock_id)
    : [];

  const paginatedComponents = React.useMemo(() => {
    if (rowsPerPage === -1) return kitComponents;
    return kitComponents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [kitComponents, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle kit selection
  const handleKitChange = (event: any) => {
    const kitId = event.target.value;
    setSelectedKit(kitId);
    const selectedKitData = salesKits.find((kit: any) => kit.id === kitId);
    if (selectedKitData) {
      setSelectedKitCode(selectedKitData.item_code);
      setFormData({
        description: selectedKitData.description || "",
        category: String(selectedKitData.category_id || ""),
      });
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Handle select change
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Update kit
  const handleUpdateKit = async () => {
    if (!selectedKitCode) return;
    try {
      // Update all rows with the same item_code
      const kitRows = existingKits.filter((code: any) => code.item_code === selectedKitCode);
      for (const row of kitRows) {
        await updateItemCode(row.id, {
          ...row,
          description: formData.description,
          category_id: formData.category,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["item-codes"] });
      setOpen(true);
      //alert("Kit updated successfully");
    } catch (error) {
      console.error("Error updating kit:", error);
      setErrorMessage("Error updating kit");
      setErrorOpen(true);
    }
  };

  // Handle add component input
  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddComponentData({ ...addComponentData, [name]: value });
    setAddErrors({ ...addErrors, [name]: "" });
  };

  // Handle component selection for add
  const handleAddComponentChange = (event: any) => {
    const selectedName = event.target.value;
    setAddComponentData({ ...addComponentData, component: selectedName });
    setAddErrors({ ...addErrors, component: "" });
  };

  // Add component
  const handleAddComponent = async () => {
    if (!selectedKit || !addComponentData.component || !addComponentData.quantity) return;
    const selectedItem = items.find((item: any) => item.description === addComponentData.component);
    if (!selectedItem) return;

    try {
      const selectedKitData = salesKits.find((kit: any) => kit.id === selectedKit);
      await createItemCode({
        item_code: selectedKitData.item_code,
        description: selectedItem.description,
        category_id: selectedKitData.category_id,
        quantity: addComponentData.quantity,
        is_foreign: 0,
        stock_id: resolveStockId(selectedItem),
      });
      queryClient.invalidateQueries({ queryKey: ["item-codes"] });
      setAddComponentData({ component: "", quantity: "" });
      setOpen(true);
    } catch (error) {
      console.error("Error adding component:", error);
      setErrorMessage(getFriendlyApiErrorMessage(error));
      setErrorOpen(true);
    }
  };

  // Edit quantity
  const handleEditQuantity = (id: string, currentQuantity: string) => {
    setEditQuantityData({ id, quantity: currentQuantity });
    setEditQuantityDialog(true);
  };

  const handleSaveQuantity = async () => {
    try {
      const row = existingKits.find((code: any) => code.id === editQuantityData.id);
      await updateItemCode(editQuantityData.id, {
        ...row,
        quantity: editQuantityData.quantity,
      });
      queryClient.invalidateQueries({ queryKey: ["item-codes"] });
      setEditQuantityDialog(false);
      alert("Quantity updated successfully");
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Error updating quantity");
    }
  };

  // Delete component
  const handleDeleteComponent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return;
    try {
      await deleteItemCode(id);
      queryClient.invalidateQueries({ queryKey: ["item-codes"] });
      alert("Component deleted successfully");
    } catch (error) {
      console.error("Error deleting component:", error);
      alert("Error deleting component");
    }
  };

  // Pre-select kit if passed from add page
  useEffect(() => {
    const kitId = (location.state as any)?.kitId;
    if (kitId && salesKits.length > 0) {
      const kitData = salesKits.find(kit => kit.id === kitId);
      if (kitData) {
        setSelectedKit(kitId);
        setSelectedKitCode(kitData.item_code);
        setFormData({
          description: kitData.description || "",
          category: String(kitData.category_id || ""),
        });
      }
    }
  }, [location.state, salesKits]);

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Edit Sales Kit" },
  ];

  return (
    <Stack>
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
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Edit Sales Kit" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Box sx={{ px: 2, mb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/itemsandinventory/maintenance/")}>Back</Button>
          </Stack>
        </Box>
      </Box>

      {/* Form */}
      <Stack sx={{ alignItems: "center" }}>
        <Paper
          sx={{
            p: theme.spacing(3),
            maxWidth: "800px",
            width: "100%",
            boxShadow: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}>
            Edit Sales Kit
          </Typography>

          <Stack spacing={2}>
            {/* Select Sales Kit */}
            <FormControl size="small" fullWidth error={!!errors.selectedKit}>
              <InputLabel>Select Sales Kit</InputLabel>
              <Select
                name="selectedKit"
                value={selectedKit}
                onChange={handleKitChange}
                label="Select Sales Kit"
              >
                {kitsLoading ? (
                  <MenuItem disabled value="">
                    Loading...
                  </MenuItem>
                ) : salesKits.length > 0 ? (
                  salesKits.map((kit: any) => (
                    <MenuItem key={kit.id} value={kit.id}>
                      {kit.item_code} - {kit.description}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No existing kits
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>{errors.selectedKit || " "}</FormHelperText>
            </FormControl>

            {selectedKitCode && (
              <>
                <TextField
                  label="Description"
                  name="description"
                  size="small"
                  fullWidth
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!errors.description}
                  helperText={errors.description || " "}
                />

                <FormControl size="small" fullWidth error={!!errors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleSelectChange}
                    label="Category"
                  >
                    {categoriesLoading ? (
                      <MenuItem disabled value="">
                        Loading...
                      </MenuItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat: any) => (
                        <MenuItem key={cat.category_id ?? cat.id} value={String(cat.category_id ?? cat.id)}>
                          {cat.description ?? cat.name ?? cat.category_name ?? cat.title ?? String(cat.category_id ?? cat.id)}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">
                        No categories
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>{errors.category || " "}</FormHelperText>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth={isMobile}
                  sx={{ backgroundColor: "var(--pallet-blue)" }}
                  onClick={handleUpdateKit}
                >
                  Update Kit
                </Button>

                {/* Components Table */}
                <Typography variant="h6" sx={{ mt: 3 }}>Kit Components</Typography>
                <TableContainer
                  component={Paper}
                  elevation={2}
                  sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
                >
                  <Table aria-label="kit components table">
                    <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                      <TableRow>
                        <TableCell>Stock Item</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Units</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {paginatedComponents.length > 0 ? (
                        paginatedComponents.map((component: any) => {
                          const correspondingItem = items.find((item: any) => item.stock_id === component.stock_id);
                          return (
                            <TableRow key={component.id}>
                              <TableCell>{component.stock_id}</TableCell>
                              <TableCell>{correspondingItem?.description || component.description}</TableCell>
                              <TableCell>{component.quantity}</TableCell>
                              <TableCell>each</TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleEditQuantity(component.id, component.quantity)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDeleteComponent(component.id)}
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2">No Records Found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>

                    <TableFooter>
                      <TableRow>
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                          colSpan={5}
                          count={kitComponents.length}
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

                {/* Add Component Form */}
                <Typography variant="h6" sx={{ mt: 3 }}>Add Component</Typography>
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <FormControl size="small" fullWidth error={!!addErrors.component}>
                    <InputLabel>Component Name</InputLabel>
                    <Select
                      name="component"
                      value={addComponentData.component}
                      onChange={handleAddComponentChange}
                      label="Component Name"
                    >
                      {itemsLoading ? (
                        <MenuItem disabled value="">
                          Loading...
                        </MenuItem>
                      ) : items.length > 0 ? (
                        items.map((item: any) => (
                          <MenuItem key={item.stock_id || item.id} value={item.description}>
                            {item.description}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          No items available
                        </MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{addErrors.component || " "}</FormHelperText>
                  </FormControl>

                  <TextField
                    label="Quantity"
                    name="quantity"
                    size="small"
                    fullWidth
                    type="number"
                    value={addComponentData.quantity}
                    onChange={handleAddInputChange}
                    error={!!addErrors.quantity}
                    helperText={addErrors.quantity || " "}
                  />
                </Stack>

                <Button
                  variant="contained"
                  fullWidth={isMobile}
                  sx={{ backgroundColor: "var(--pallet-blue)" }}
                  onClick={handleAddComponent}
                >
                  Add Component
                </Button>
              </>
            )}
          </Stack>
        </Paper>

        {/* Edit Quantity Dialog */}
        <Dialog open={editQuantityDialog} onClose={() => setEditQuantityDialog(false)}>
          <DialogTitle>Edit Quantity</DialogTitle>
          <DialogContent>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={editQuantityData.quantity}
              onChange={(e) => setEditQuantityData({ ...editQuantityData, quantity: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditQuantityDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveQuantity}>Save</Button>
          </DialogActions>
        </Dialog>
      </Stack>
      <UpdateConfirmationModal
        open={open}
        title="Success"
        content="Sales kit has been updated successfully!"
        handleClose={() => setOpen(false)}
        onSuccess={() => window.history.back()}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}