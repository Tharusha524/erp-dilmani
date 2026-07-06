import React, { useState, useEffect, useMemo } from "react";
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
}

export default function OutstandingPurchaseOrdersMaintenance() {
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

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });

  useEffect(() => {
    if (!selectedItem) {
      setItemCode("");
      return;
    }
    const it = (items || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    setItemCode(it ? String(it.stock_id ?? it.id ?? "") : "");
  }, [selectedItem, items]);

  // fetch outstanding purchase orders via inquiry API
  const inquiryParams = useMemo(
    () => ({
      outstanding: true,
      ...(selectedSupplier !== "ALL_SUPPLIERS"
        ? { supplier_id: Number(selectedSupplier) }
        : {}),
      ...(fromDate ? { from_date: fromDate } : {}),
      ...(toDate ? { to_date: toDate } : {}),
      ...(numberText ? { reference: numberText } : {}),
      ...(location !== "ALL_LOCATIONS" ? { into_stock_location: location } : {}),
      ...(itemCode ? { item_code: itemCode } : {}),
    }),
    [selectedSupplier, fromDate, toDate, numberText, location, itemCode]
  );

  const { data: purchOrders = [] } = useQuery({
    queryKey: ["purchaseOrdersInquiry", inquiryParams],
    queryFn: () => getPurchaseOrdersInquiry(inquiryParams),
  });

  // map purchase orders into table rows
  const mappedRows: Row[] = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    if (!Array.isArray(purchOrders) || purchOrders.length === 0) return [];

    const filtered = (purchOrders as any[]).filter((p: any) => {
      const refVal = String(p.reference ?? "").toLowerCase().trim();
      if (refVal === "auto") return false;

      if (numberText) {
        const search = String(numberText).toLowerCase();
        const orderNoStr = String(p.order_no ?? p.id ?? "");
        const referenceStr = String(p.reference ?? "").toLowerCase();
        if (!orderNoStr.includes(search) && !referenceStr.includes(search)) return false;
      }

      return true;
    });

      const normalizeDate = (val: any) => {
        const todayVal = new Date().toISOString().split("T")[0];
        if (!val && val !== 0) return todayVal;
        const s = String(val);
        if (s.includes("T")) return s.split("T")[0];
        if (s.includes(" ")) return s.split(" ")[0];
        try {
          const d = new Date(s);
          if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
        } catch (e) {
          /* ignore */
        }
        return s;
      };

      return filtered.map((p: any) => {
      // resolve supplier
      const sup = (suppliers || []).find((s: any) => String(s.supplier_id ?? s.id ?? s.debtor_no) === String(p.supplier_id ?? p.supp_id ?? p.supplier));
      const supplierName = sup ? (sup.supp_name ?? sup.name ?? sup.supplier_name) : String(p.supplier_id ?? "");
      const currency = sup ? (sup.curr_code ?? sup.currency ?? sup.currCode ?? "") : "";

      // resolve location
      const loc = (locations || []).find((l: any) => String(l.loc_code) === String(p.into_stock_location) || String(l.id) === String(p.into_stock_location));
      const locationName = loc ? (loc.location_name ?? String(p.into_stock_location)) : String(p.into_stock_location ?? "");

      return {
        id: Number(p.order_no ?? p.id ?? 0),
        deliveryNo: String(p.order_no ?? p.id ?? ""),
        supplier: supplierName,
        branch: locationName,
        contact: "",
        reference: p.reference ?? "",
        custRef: null,
        deliveryDate: normalizeDate(p.ord_date ?? today),
        dueBy: "",
        deliveryTotal: p.total ?? 0,
        currency: currency ?? "",
      } as Row;
    });
  }, [purchOrders, suppliers, locations, numberText, selectedSupplier]);

  const paginatedRows = React.useMemo(() => {
    const source = mappedRows;
    if (rowsPerPage === -1) return source;
    return source.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [mappedRows, page, rowsPerPage]);

  // reset to first page when filters change so new filtered results are visible
  useEffect(() => {
    setPage(0);
  }, [numberText, fromDate, toDate, location, selectedItem, selectedSupplier]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Search Outstanding Purchase Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Search Outstanding Purchase Orders" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
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
              <InputLabel id="iasd-location-label">Location</InputLabel>
              <Select labelId="iasd-location-label" value={location} label="Location" onChange={(e) => setLocation(String(e.target.value))}>
                <MenuItem value="ALL_LOCATIONS">All Locations</MenuItem>
                {(locations || []).map((loc: any) => (
                  <MenuItem key={loc.loc_code} value={loc.loc_code}>{loc.location_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

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
                  <MenuItem key={s.supplier_id ?? s.id ?? s.debtor_no} value={String(s.supplier_id ?? s.id ?? s.debtor_no)}>{s.supp_name ?? s.name ?? s.supplier_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={() => console.log("InvoiceAgainstSalesDelivery search", { numberText, fromDate, toDate, location, selectedItem })}>
              Search
            </Button>
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
            {paginatedRows.map((r, index) => (
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
                    <Button variant="outlined" size="small" onClick={() => navigate("/purchase/transactions/update-purchase-order-entry", { state: { id: r.id } })}>Edit</Button>
                    <Button variant="outlined" size="small" onClick={() => navigate("/purchase/transactions/receive-purchase-order-items", { state: { id: r.id } })}>Receive</Button>
                    <Button variant="outlined" size="small">Print</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={9}
                count={mappedRows.length}
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
