import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import theme from "../../../../theme";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import SearchBar from "../../../../components/SearchBar";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getLocStocks, updateLocStock } from "../../../../api/LocStock/LocStockApi";
import { getItemById, getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getItemTypes } from "../../../../api/ItemType/ItemType";
import { getStockMoves } from "../../../../api/StockMoves/StockMovesApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UpdateConfirmationModal from "../../../../components/UpdateConfirmationModal"
import ErrorModal from "../../../../components/ErrorModal";
import FormattedNumberField from "../../../../components/FormattedNumberField";

interface ItemReOderlevelProps {
  itemId?: string | number;
}

export default function ReOrderLevelsTable({ itemId }: ItemReOderlevelProps) {
  const [reorderLevels, setReorderLevels] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | number>(itemId || "");
  const [showInactive, setShowInactive] = useState(false);

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Fetch inventory locations
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["inventoryLocations"],
    queryFn: getInventoryLocations,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  // Fetch loc stock data for the item
  const { data: locStocks = [] } = useQuery({
    queryKey: ["locStocks", selectedItem],
    queryFn: getLocStocks,
    enabled: !!selectedItem,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  // Fetch item data
  const { data: itemData } = useQuery({
    queryKey: ["item", selectedItem],
    queryFn: () => getItemById(selectedItem),
    enabled: !!selectedItem,
  });

  // Fetch item units
  const { data: itemUnits = [] } = useQuery({
    queryKey: ["itemUnits"],
    queryFn: getItemUnits,
  });

  // Fetch items for dropdown
  const { data: items = [] } = useQuery<{ stock_id: string | number; category_id: string | number; description: string; inactive: number; mb_flag: number }[]>({
    queryKey: ["items"],
    queryFn: () => getItems() as Promise<{ stock_id: string | number; category_id: string | number; description: string; inactive: number; mb_flag: number }[]>,
  });

  // Fetch categories for grouping
  const { data: categories = [] } = useQuery<{ category_id: number; description: string }[]>({
    queryKey: ["itemCategories"],
    queryFn: () => getItemCategories() as Promise<{ category_id: number; description: string }[]>,
  });

  // Fetch item types for filtering
  const { data: itemTypes = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["itemTypes"],
    queryFn: () => getItemTypes() as Promise<{ id: number; name: string }[]>,
  });

  // Fetch stock moves data
  const { data: stockMoves = [] } = useQuery({
    queryKey: ["stockMoves"],
    queryFn: getStockMoves,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  // Populate reorder levels from loc stock data
  useEffect(() => {
    if (locStocks.length > 0 && selectedItem) {
      const filteredStocks = locStocks.filter(stock => stock.stock_id === selectedItem.toString());
      const levels: Record<string, string> = {};
      filteredStocks.forEach(stock => {
        levels[stock.loc_code] = stock.reorder_level.toString();
      });
      setReorderLevels(levels);
    }
  }, [locStocks, selectedItem]);

  // Preselect item from navigation state when present
  useEffect(() => {
    try {
      const navStock = (location as any)?.state?.stock_id;
      if (navStock) {
        setSelectedItem(String(navStock));
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  // Find the unit text
  const unitText = useMemo(() => {
    if (itemData?.units && itemUnits.length > 0) {
      const unit = itemUnits.find((u: any) => u.id === itemData.units);
      return unit?.description || unit?.name || itemData.units;
    }
    return itemData?.units || "N/A";
  }, [itemData, itemUnits]);

  // Compute quantity on hand per location
  const quantityOnHandMap = useMemo(() => {
    if (!selectedItem || stockMoves.length === 0) return {};
    const filteredMoves = stockMoves.filter((move: any) => move.stock_id === selectedItem);
    return filteredMoves.reduce((acc: { [key: string]: number }, move: any) => {
      const locCode = move.loc_code;
      if (!acc[locCode]) {
        acc[locCode] = 0;
      }
      acc[locCode] += parseFloat(move.qty) || 0;
      return acc;
    }, {});
  }, [stockMoves, selectedItem]);

  // Filter by search
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      return location.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [locations, searchQuery]);

  const paginatedLocations = useMemo(() => {
    if (rowsPerPage === -1) return filteredLocations;
    return filteredLocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredLocations, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleReorderLevelChange = (locCode: string, value: string) => {
    setReorderLevels({ ...reorderLevels, [locCode]: value });
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    try {
      const updates = Object.entries(reorderLevels).map(([locCode, reorderLevel]) => {
        if (reorderLevel.trim() !== '') {
          return updateLocStock(locCode, selectedItem.toString(), { loc_code: locCode, stock_id: selectedItem.toString(), reorder_level: parseFloat(reorderLevel) });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ["locStocks", selectedItem] });
      setOpen(true);
    } catch (error) {
      console.error("Error updating reorder levels:", error);
      setErrorMessage("Failed to update reorder levels.");
      setErrorOpen(true);
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Reorder Levels" },
  ];

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
        <Typography>Loading locations...</Typography>
      </Stack>
    );
  }

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
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title="Reorder Levels" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        {/* Item dropdown and checkbox */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Select Item</InputLabel>
            <Select
              value={selectedItem}
              label="Select Item"
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <MenuItem value="" key="none">
                Select an Item
              </MenuItem>

              {/* Group items by category_id */}
              {(() => {
                const filteredItems = items.filter(item => (showInactive || item.inactive !== 1) && item.mb_flag !== undefined && itemTypes.find(type => type.id === item.mb_flag)?.name !== 'Service');
                return Object.entries(
                  filteredItems.reduce((groups, item) => {
                    const catId = item.category_id || "Uncategorized";
                    if (!groups[catId]) groups[catId] = [];
                    groups[catId].push(item);
                    return groups;
                  }, {} as Record<string, typeof filteredItems>)
                ).map(([categoryId, groupedItems]) => {
                  const category = categories.find(cat => cat.category_id === Number(categoryId));
                  const categoryLabel = category ? category.description : `Category ${categoryId}`;
                  return [
                    <ListSubheader key={`cat-${categoryId}`}>
                      {categoryLabel}
                    </ListSubheader>,
                    groupedItems.map((item) => (
                      <MenuItem key={item.stock_id} value={item.stock_id}>
                        {item.description}
                      </MenuItem>
                    ))
                  ];
                });
              })()}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label="Show Inactive"
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!selectedItem}
          >
            Update
          </Button>

          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Box>
      {/* Search */}
      <Stack
        direction="row"
        sx={{ px: 2, mb: 2, width: "100%", justifyContent: "flex-end" }}
      >
        <Box sx={{ width: isMobile ? "100%" : "300px" }}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search Location Name..."
          />
        </Box>
      </Stack>
      {/* Table */}
      <Stack sx={{ alignItems: "center" }}>
        <>
          {/* Item Info */}
          <Box sx={{ width: "100%", mb: 2, px: 2, textAlign: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
              {itemData?.stock_id || selectedItem || "No Item Selected"} - {itemData?.description || "Select an Item"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In unit of: {unitText}
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            elevation={2}
            sx={{ overflowX: "auto", maxWidth: isMobile ? "88vw" : "100%" }}
          >
            <Table aria-label="reorder levels table">
              <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Location Name</TableCell>
                  <TableCell>Quantity On Hand</TableCell>
                  <TableCell>Reorder Level</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedLocations.length > 0 ? (
                  paginatedLocations.map((location, index) => (
                    <TableRow key={location.loc_code} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{location.location_name}</TableCell>
                      <TableCell>{quantityOnHandMap[location.loc_code] || 0}</TableCell>
                      <TableCell>
                        <FormattedNumberField
                          size="small"
                          value={reorderLevels[location.loc_code] || ""}
                          onChange={(e) => handleReorderLevelChange(location.loc_code, e.target.value)}
                          placeholder="Enter reorder level"
                          disabled={!selectedItem}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2">No Locations Found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                    colSpan={4}
                    count={filteredLocations.length}
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
        </>
      </Stack>
      <UpdateConfirmationModal
        open={open}
        title="Success"
        content="Reorder levels has been updated!"
        handleClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </FormPageLayout>
  );
}
