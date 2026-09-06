import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, Autocomplete, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Typography, Chip, InputAdornment, IconButton,
  Collapse, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TuneIcon from "@mui/icons-material/Tune";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import { getStockList } from "../../../api/Inventory/StockListApi";
import { getItemCategories } from "../../../api/ItemCategories/ItemCategoriesApi";
import { createStockAdjustment } from "../../../api/Pos/posOpsApi";
import { getInventoryLocations } from "../../../api/InventoryLocation/InventoryLocationApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";
import { notify } from "../../../services/notificationService";

/**
 * One "Stock" page — search/browse inventory, click a row's arrow to
 * expand its full details (category, subcategory, brand, barcode, cost)
 * inline, and adjust its stock right there. Browsing itself stays
 * read-only (no writes); the Adjust action calls the exact same genuine
 * createStockAdjustment flow the old standalone Stock Adjustments page
 * used — same accounting-safe stock-movement logic, just reached from
 * inside this same row instead of a separate screen/tab.
 */
export default function StockPage() {
  const { formatCurrency } = useHomeCurrency();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<any>(null);
  const [expandedStockId, setExpandedStockId] = useState<string | null>(null);

  const { data: categories } = useQuery({ queryKey: ["item-categories"], queryFn: () => getItemCategories() });
  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock-list", search, category?.category_id],
    queryFn: () => getStockList({ search: search || undefined, category_id: category?.category_id }),
  });

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Stock" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Stock" }]} />
        <Typography variant="caption" color="text.secondary">
          Search inventory — click the arrow on a product to see its full details and adjust stock.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name, stock ID, or barcode — scan or type"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <Autocomplete
              sx={{ minWidth: 240 }}
              options={categories ?? []}
              getOptionLabel={(c: any) => c.description ?? ""}
              value={category}
              onChange={(_, v) => setCategory(v)}
              renderInput={(p) => <TextField {...p} label="Category" size="small" />}
            />
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell width={48} />
                <TableCell>Product</TableCell>
                <TableCell>Stock ID</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity on Hand</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(stock ?? []).map((s: any) => {
                const isOpen = expandedStockId === s.stock_id;
                return (
                  <Fragment key={s.stock_id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => setExpandedStockId(isOpen ? null : s.stock_id)}>
                          {isOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{s.description}</TableCell>
                      <TableCell>{s.stock_id}</TableCell>
                      <TableCell>{s.category_name ?? "—"}</TableCell>
                      <TableCell align="right">{formatCurrency(s.purchase_cost)}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={s.quantity} color={s.quantity <= 0 ? "error" : "default"} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: isOpen ? undefined : "none" }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <ProductDetailPanel product={s} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
              {(!stock || stock.length === 0) && (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2">No matching products.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </FormPageLayout>
  );
}

// ---------------------------------------------------------------------------
// Expanded row: full product details + an "Adjust Stock" action.
// ---------------------------------------------------------------------------
function ProductDetailPanel({ product }: { product: any }) {
  const { formatCurrency } = useHomeCurrency();
  const queryClient = useQueryClient();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [locCode, setLocCode] = useState("");
  const [movementType, setMovementType] = useState<"add" | "reduce" | "override">("add");
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("");

  const { data: locations } = useQuery({ queryKey: ["inventory-locations"], queryFn: getInventoryLocations, enabled: adjustOpen });

  const adjustMutation = useMutation({
    mutationFn: () => createStockAdjustment({
      stock_id: product.stock_id,
      loc_code: locCode,
      movement_type: movementType,
      quantity: Number(quantity) || 0,
      reason,
    }),
    onSuccess: () => {
      notify.success("Stock adjusted");
      queryClient.invalidateQueries({ queryKey: ["stock-list"] });
      setAdjustOpen(false);
      setLocCode("");
      setMovementType("add");
      setQuantity("0");
      setReason("");
    },
    onError: () => notify.error("Failed to adjust stock"),
  });

  return (
    <Box sx={{ py: 2, px: 1 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Category</Typography>
          <Typography variant="body2">{product.category_name ?? "—"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Subcategory</Typography>
          <Typography variant="body2">{product.subcategory_name ?? "—"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Brand</Typography>
          <Typography variant="body2">{product.brand_name ?? "—"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Barcode</Typography>
          <Typography variant="body2">{product.barcode ?? "No barcode linked"}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Purchase Cost</Typography>
          <Typography variant="body2">{formatCurrency(product.purchase_cost)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Quantity on Hand</Typography>
          <Typography variant="body2">{product.quantity}</Typography>
        </Grid>
      </Grid>

      <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={() => setAdjustOpen(true)}>
        Adjust Stock
      </Button>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {product.description}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select value={locCode} label="Location" onChange={(e) => setLocCode(e.target.value)}>
                {(locations ?? []).map((loc: any) => (
                  <MenuItem key={loc.loc_code} value={loc.loc_code}>{loc.location_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Movement Type</InputLabel>
              <Select value={movementType} label="Movement Type" onChange={(e) => setMovementType(e.target.value as any)}>
                <MenuItem value="add">Add Stock</MenuItem>
                <MenuItem value="reduce">Reduce Stock</MenuItem>
                <MenuItem value="override">Override (set exact quantity)</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Quantity" type="number" fullWidth value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <TextField label="Reason" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} placeholder="waste / damage / general / count correction" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!locCode || adjustMutation.isPending} onClick={() => adjustMutation.mutate()}>
            {adjustMutation.isPending ? "Saving..." : "Apply Adjustment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
