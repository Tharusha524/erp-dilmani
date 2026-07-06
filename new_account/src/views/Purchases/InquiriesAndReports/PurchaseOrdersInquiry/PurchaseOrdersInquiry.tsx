import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Paper,
  TextField,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  FormControl,
  InputLabel,
  Select,
  TableFooter,
  TablePagination,
  ListSubheader,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getPurchaseOrdersInquiry } from "../../../../api/Purchases/PurchasesApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  deliveryNo: string;
  supplier: string;
  branch: string;
  contact: string;
  reference: string;
  custRef: string;
  deliveryDate: string;
  dueBy: string;
  deliveryTotal: string | number;
  currency: string;
  hasOutstanding?: boolean;
}

export default function PurchaseOrdersInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // lookups
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: categories = [] } = useQuery({ queryKey: ["itemCategories"], queryFn: () => getItemCategories() });

  // header/state
  const [numberText, setNumberText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [location, setLocation] = useState("ALL_LOCATIONS");
  const [itemCode, setItemCode] = useState("");
  const [selectedItem, setSelectedItem] = useState("ALL_ITEMS");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL_SUPPLIERS");
  const [showOutstandingOnly, setShowOutstandingOnly] = useState(false);

  type AppliedFilters = {
    numberText: string;
    fromDate: string;
    toDate: string;
    location: string;
    selectedItem: string;
    itemCode: string;
    selectedSupplier: string;
    showOutstandingOnly: boolean;
  };

  const [applied, setApplied] = useState<AppliedFilters>({
    numberText: "",
    fromDate: "",
    toDate: "",
    location: "ALL_LOCATIONS",
    selectedItem: "ALL_ITEMS",
    itemCode: "",
    selectedSupplier: "ALL_SUPPLIERS",
    showOutstandingOnly: false,
  });

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });

  useEffect(() => {
    if (!selectedItem) {
      setItemCode("");
      return;
    }
    const it = (items || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    setItemCode(it ? String(it.stock_id ?? it.id ?? "") : "");
  }, [selectedItem, items]);

  const inquiryParams = useMemo(
    () => ({
      ...(applied.showOutstandingOnly ? { outstanding: true } : {}),
      ...(applied.selectedSupplier !== "ALL_SUPPLIERS"
        ? { supplier_id: Number(applied.selectedSupplier) }
        : {}),
      ...(applied.numberText.trim()
        ? { order_no: Number(applied.numberText) || undefined }
        : {}),
      ...(applied.fromDate ? { from_date: applied.fromDate } : {}),
      ...(applied.toDate ? { to_date: applied.toDate } : {}),
      ...(applied.location !== "ALL_LOCATIONS"
        ? { into_stock_location: applied.location }
        : {}),
      ...(applied.selectedItem !== "ALL_ITEMS"
        ? { item_code: applied.selectedItem }
        : {}),
      ...(applied.itemCode.trim() && applied.selectedItem === "ALL_ITEMS"
        ? { item_code: applied.itemCode.trim() }
        : {}),
      limit: 500,
    }),
    [applied]
  );

  const { data: purchOrders = [], isLoading, isFetching } = useQuery({
    queryKey: ["purchaseOrdersInquiry", inquiryParams],
    queryFn: () => getPurchaseOrdersInquiry(inquiryParams),
  });

  const handleSearch = useCallback(() => {
    setApplied({
      numberText,
      fromDate,
      toDate,
      location,
      selectedItem,
      itemCode,
      selectedSupplier,
      showOutstandingOnly,
    });
    setPage(0);
  }, [
    numberText,
    fromDate,
    toDate,
    location,
    selectedItem,
    itemCode,
    selectedSupplier,
    showOutstandingOnly,
  ]);

  const rows: Row[] = useMemo(() => {
    const fmtDate = (v: any) => {
      if (!v && v !== 0) return "";
      try {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      } catch {
        // fall through
      }
      return String(v).split("T")[0];
    };

    return (purchOrders || []).map((po: any) => {
      const supp = (suppliers || []).find(
        (s: any) => String(s.supplier_id ?? s.id) === String(po.supplier_id ?? "")
      );
      const loc = (locations || []).find(
        (l: any) => String(l.loc_code ?? l.code ?? l.id) === String(po.into_stock_location ?? "")
      );

      return {
        id: Number(po.order_no ?? 0),
        deliveryNo: String(po.order_no ?? ""),
        reference: po.reference ?? "",
        supplier: po.supplier_name ?? supp?.supp_name ?? String(po.supplier_id ?? ""),
        branch: loc ? (loc.location_name ?? String(loc.loc_code ?? loc.id)) : String(po.into_stock_location ?? ""),
        contact: "",
        custRef: po.requisition_no ?? "",
        deliveryDate: fmtDate(po.ord_date ?? ""),
        dueBy: "",
        deliveryTotal: po.total ?? 0,
        currency: supp?.curr_code ?? "",
        hasOutstanding: Boolean(po.has_outstanding),
      } as Row;
    });
  }, [purchOrders, suppliers, locations]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Search Purchase Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Search Purchase Orders" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* First row: #, From, To, Into Location */}
          <Grid container item xs={12} spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="#" value={numberText} onChange={(e) => setNumberText(e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="iasd-location-label">Into Location</InputLabel>
                <Select labelId="iasd-location-label" value={location} label="Location" onChange={(e) => setLocation(String(e.target.value))}>
                  <MenuItem value="ALL_LOCATIONS">All Locations</MenuItem>
                  {(locations || []).map((loc: any) => (
                    <MenuItem key={loc.loc_code} value={loc.loc_code}>{loc.location_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Second row: Item Code, Select Item, Select Supplier, Search */}
          <Grid container item xs={12} spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Item Code" value={itemCode} InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="iasd-item-label">Select Item</InputLabel>
                <Select labelId="iasd-item-label" value={selectedItem ?? ""} label="Select Item" onChange={(e) => setSelectedItem(String(e.target.value))}>
                  <MenuItem value="ALL_ITEMS">All Items</MenuItem>
                  {(() => {
                    const filteredItems = items || [];
                    return (Object.entries(
                      filteredItems.reduce((groups: Record<string, any[]>, item) => {
                        const catId = item.category_id || "Uncategorized";
                        if (!groups[catId]) groups[catId] = [];
                        groups[catId].push(item);
                        return groups;
                      }, {})
                    ) as [string, any][]).map(([categoryId, groupedItems]) => {
                      const category = categories.find((cat: any) => cat.category_id === Number(categoryId));
                      const categoryLabel = category ? category.description : `Category ${categoryId}`;
                      return [
                        <ListSubheader key={`cat-${categoryId}`}>
                          {categoryLabel}
                        </ListSubheader>,
                        groupedItems.map((item: any) => (
                          <MenuItem key={item.stock_id ?? item.id} value={String(item.stock_id ?? item.id)}>
                            {item.description ?? item.item_name ?? item.name}
                          </MenuItem>
                        ))
                      ];
                    });
                  })()}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="iasd-supplier-label">Select Supplier</InputLabel>
                <Select labelId="iasd-supplier-label" value={selectedSupplier ?? ""} label="Select Supplier" onChange={(e) => setSelectedSupplier(String(e.target.value))}>
                  <MenuItem value="ALL_SUPPLIERS">All Suppliers</MenuItem>
                  {(suppliers || []).map((s: any) => (
                    <MenuItem key={s.supplier_id ?? s.id} value={String(s.supplier_id ?? s.id)}>{s.supp_name ?? s.name ?? s.supplier_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOutstandingOnly}
                    onChange={(e) => setShowOutstandingOnly(e.target.checked)}
                  />
                }
                label="Outstanding only"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={isFetching}
              >
                {isFetching ? "Searching…" : "Search"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Supplier's Reference</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Order Total</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading purchase orders…
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No purchase orders match your search.
                    {applied.showOutstandingOnly
                      ? " Try clearing “Outstanding only” to see all orders."
                      : ""}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
            paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.deliveryNo}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.supplier}</TableCell>
                <TableCell>{r.branch}</TableCell>
                <TableCell>{r.custRef}</TableCell>
                <TableCell>{r.deliveryDate}</TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell>{formatTransactionMoney(r.deliveryTotal, r.currency)}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate("/purchase/transactions/update-purchase-order-entry", {
                          state: { id: r.id, orderNo: r.id },
                        })
                      }
                    >
                      Edit
                    </Button>
                    {r.hasOutstanding ? (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={() =>
                          navigate("/purchase/transactions/receive-purchase-order-items", {
                            state: { id: r.id, orderNo: r.id },
                          })
                        }
                      >
                        Receive
                      </Button>
                    ) : null}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate("/purchase/transactions/purchase-order-entry/view-purchase-order", {
                          state: { id: r.id, orderNo: r.id },
                        })
                      }
                    >
                      View
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={9}
                count={rows.length}
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
  );
}
