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
  MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { getStandaloneStocks, addStandaloneStockQuantity, deductStandaloneStockQuantity } from "../../api/StandaloneStock/standaloneStockApi";
import { enqueueSnackbar } from "notistack";

const cellSx = {
  borderRight: "1px solid var(--pallet-border-blue)",
  whiteSpace: "nowrap",
  "&:last-of-type": { borderRight: "none" },
} as const;

const Stock = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openInDialog, setOpenInDialog] = useState(false);
  const [openOutDialog, setOpenOutDialog] = useState(false);
  
  // Dialog state
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [addQuantity, setAddQuantity] = useState<number | "">("");
  const [removeQuantity, setRemoveQuantity] = useState<number | "">("");

  // Fetch real data from backend
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["standalone-stocks"],
    queryFn: getStandaloneStocks,
  });

  // Mutation to add stock
  const inMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      addStandaloneStockQuantity(id, quantity),
    onSuccess: () => {
      enqueueSnackbar("Stock added successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["standalone-stocks"] });
      handleCloseInDialog();
    },
    onError: (error) => {
      enqueueSnackbar("Failed to add stock.", { variant: "error" });
      console.error(error);
    }
  });

  // Mutation to remove stock
  const outMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      deductStandaloneStockQuantity(id, quantity),
    onSuccess: () => {
      enqueueSnackbar("Stock deducted successfully!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["standalone-stocks"] });
      handleCloseOutDialog();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.errors?.quantity?.[0] || "Failed to deduct stock.";
      enqueueSnackbar(msg, { variant: "error" });
      console.error(error);
    }
  });

  const handleOpenInDialog = () => {
    setOpenInDialog(true);
  };

  const handleCloseInDialog = () => {
    setOpenInDialog(false);
    setSelectedItemId("");
    setAddQuantity("");
  };

  const handleOpenOutDialog = () => {
    setOpenOutDialog(true);
  };

  const handleCloseOutDialog = () => {
    setOpenOutDialog(false);
    setSelectedItemId("");
    setRemoveQuantity("");
  };

  const handleSaveIn = () => {
    if (!selectedItemId || !addQuantity) return;
    inMutation.mutate({ id: Number(selectedItemId), quantity: Number(addQuantity) });
  };

  const handleSaveOut = () => {
    if (!selectedItemId || !removeQuantity) return;
    outMutation.mutate({ id: Number(selectedItemId), quantity: Number(removeQuantity) });
  };

  const filteredItems = stockItems.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box p={3} sx={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" color="success" onClick={handleOpenInDialog}>
          In
        </Button>
        <Button variant="contained" color="error" onClick={handleOpenOutDialog}>
          Out
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/stock/manage')}>
          Modify
        </Button>
      </Stack>

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        List of all stock items
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search Stock Items"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300 }}
        />
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
              {["Stock Item", "Quantity"].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    ...cellSx,
                    fontWeight: 700,
                    backgroundColor: "var(--pallet-lighter-blue)",
                    whiteSpace: "nowrap",
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
                <TableCell colSpan={2} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">No stock items found.</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
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
                  <TableCell sx={cellSx}>{item.item_name}</TableCell>
                  <TableCell sx={cellSx}>{item.quantity}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* IN Dialog */}
      <Dialog open={openInDialog} onClose={handleCloseInDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Stock In</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              select
              label="Select Stock Item"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
            >
              {stockItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.item_name} (Current: {item.quantity})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity to Add"
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveIn} 
            variant="contained" 
            color="success" 
            disabled={!selectedItemId || !addQuantity || inMutation.isPending}
          >
            {inMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OUT Dialog */}
      <Dialog open={openOutDialog} onClose={handleCloseOutDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Stock Out</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              select
              label="Select Stock Item"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
            >
              {stockItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.item_name} (Current: {item.quantity})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity to Remove"
              type="number"
              value={removeQuantity}
              onChange={(e) => setRemoveQuantity(e.target.value ? Number(e.target.value) : "")}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOutDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveOut} 
            variant="contained" 
            color="error" 
            disabled={!selectedItemId || !removeQuantity || outMutation.isPending}
          >
            {outMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Stock;
