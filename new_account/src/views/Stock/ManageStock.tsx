import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStandaloneStocks, createStandaloneStockItem, updateStandaloneStockItem, deleteStandaloneStockItem, StandaloneStockItem } from "../../api/StandaloneStock/standaloneStockApi";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from 'react-router-dom';

const cellSx = {
  borderRight: "1px solid var(--pallet-border-blue)",
  whiteSpace: "nowrap",
  "&:last-of-type": { borderRight: "none" },
} as const;

const ManageStock = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StandaloneStockItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  
  // Form State
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");

  // Fetch data
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["standalone-stocks"],
    queryFn: getStandaloneStocks,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { item_name: string; quantity: number }) => createStandaloneStockItem(data.item_name, data.quantity),
    onSuccess: () => {
      enqueueSnackbar("Item created successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["standalone-stocks"] });
      handleCloseDialog();
    },
    onError: () => enqueueSnackbar("Failed to create item.", { variant: "error" })
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; item_name: string; quantity: number }) => updateStandaloneStockItem(data.id, data.item_name, data.quantity),
    onSuccess: () => {
      enqueueSnackbar("Item updated successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["standalone-stocks"] });
      handleCloseDialog();
    },
    onError: () => enqueueSnackbar("Failed to update item.", { variant: "error" })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStandaloneStockItem(id),
    onSuccess: () => {
      enqueueSnackbar("Item deleted successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["standalone-stocks"] });
    },
    onError: () => enqueueSnackbar("Failed to delete item.", { variant: "error" })
  });

  const handleOpenDialog = (item?: StandaloneStockItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.item_name);
      setQuantity(item.quantity);
    } else {
      setEditingItem(null);
      setItemName("");
      setQuantity("");
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setItemName("");
    setQuantity("");
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!itemName || quantity === "") return;
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, item_name: itemName, quantity: Number(quantity) });
    } else {
      createMutation.mutate({ item_name: itemName, quantity: Number(quantity) });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteItemId !== null) {
      deleteMutation.mutate(deleteItemId);
      setOpenDeleteDialog(false);
      setDeleteItemId(null);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setDeleteItemId(null);
  };

  return (
    <Box p={3} sx={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Manage Items
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/stock')}>
          Back to Stock Page
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
        >
          Add New Item
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          width: "100%",
          minWidth: 0,
          overflowX: "auto",
          borderRadius: 2,
          border: "1px solid var(--pallet-border-blue)",
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 500, borderCollapse: "separate" }}>
          <TableHead>
            <TableRow>
              {["ID", "Stock Item Name", "Quantity", "Actions"].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    ...cellSx,
                    fontWeight: 700,
                    backgroundColor: "var(--pallet-lighter-blue)",
                    whiteSpace: "nowrap",
                    ...(label === "Actions" ? { textAlign: "center" } : {})
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Loading...</TableCell>
              </TableRow>
            ) : stockItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No stock items found.</TableCell>
              </TableRow>
            ) : (
              stockItems.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  <TableCell sx={cellSx}>{item.id}</TableCell>
                  <TableCell sx={cellSx}>{item.item_name}</TableCell>
                  <TableCell sx={cellSx}>{item.quantity}</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? "Edit Stock Item" : "Add New Stock Item"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Initial Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary" 
            disabled={!itemName || quantity === "" || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageStock;
