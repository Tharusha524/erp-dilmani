import { Fragment, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, Autocomplete, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Typography, Chip, InputAdornment, IconButton,
  Collapse, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Grid, Tabs, Tab, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TuneIcon from "@mui/icons-material/Tune";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import { getStockList } from "../../../api/Inventory/StockListApi";
import { getItemCategories } from "../../../api/ItemCategories/ItemCategoriesApi";
import { createStockAdjustment, getStockAdjustments } from "../../../api/Pos/posOpsApi";
import { getStockDamages, recordStockDamage, deleteStockDamage } from "../../../api/Pos/posApi";
import { getInventoryLocations } from "../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../api/Item/ItemApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";
import { notify } from "../../../services/notificationService";
import { useOnlineStatus, getOrCreateTerminalId } from "../../../offline/useOnlineStatus";
import {
  isDesktopApp, saveReferenceData, getReferenceData,
  listProducts as listOfflineProducts, queuePendingStockDamage, listAllPendingStockDamages,
  deletePendingStockDamage, type PendingStockDamage,
} from "../../../offline/db";

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
  const [tab, setTab] = useState<"products" | "damage">("products");

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Stock" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Stock" }]} />
        <Typography variant="caption" color="text.secondary">
          Search inventory — click the arrow on a product to see its full details and adjust stock.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="products" label="Products" />
        <Tab value="damage" label="Stock Damage" />
      </Tabs>

      {tab === "products" ? <ProductsTab /> : <StockDamageTab />}
    </FormPageLayout>
  );
}

// ---------------------------------------------------------------------------
// "Products" tab: the existing search/browse/expand/adjust stock browser.
// ---------------------------------------------------------------------------
function ProductsTab() {
  const { formatCurrency } = useHomeCurrency();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<any>(null);
  const [expandedStockId, setExpandedStockId] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const isOffline = isDesktopApp() && !isOnline;

  const { data: categories } = useQuery({ queryKey: ["item-categories"], queryFn: () => getItemCategories() });
  const { data: stockFromApi, isLoading } = useQuery({
    queryKey: ["stock-list", search, category?.category_id],
    queryFn: () => getStockList({ search: search || undefined, category_id: category?.category_id }),
  });

  // A separate, always-unfiltered fetch purely to keep a full offline
  // snapshot current — the filtered query above only ever holds whatever
  // the cashier last searched for, which isn't enough to browse offline.
  const { data: fullStockFromApi } = useQuery({ queryKey: ["stock-list-all"], queryFn: () => getStockList() });
  const [offlineStock, setOfflineStock] = useState<any[]>([]);

  useEffect(() => {
    if (!isDesktopApp()) return;
    getReferenceData<any[]>("stock_list").then((v) => v && setOfflineStock(v)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isDesktopApp() || !fullStockFromApi || fullStockFromApi.length === 0) return;
    saveReferenceData("stock_list", fullStockFromApi).catch(() => {});
  }, [fullStockFromApi]);

  // Offline: filter the cached full snapshot client-side the same way the
  // server would, since there's nothing to send the search/category to.
  const stock = isOffline
    ? offlineStock.filter((s: any) => {
        const matchesSearch = !search || [s.description, s.stock_id, s.barcode].some((v) =>
          String(v ?? "").toLowerCase().includes(search.toLowerCase())
        );
        const matchesCategory = !category?.category_id || s.category_id === category.category_id;
        return matchesSearch && matchesCategory;
      })
    : (stockFromApi ?? []);

  return (
    <>
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

      {isOffline && (
        <Chip label="Offline — showing the last synced stock snapshot" color="warning" size="small" sx={{ mb: 2 }} />
      )}

      {isLoading && !isOffline ? <PageLoader /> : (
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
    </>
  );
}

// ---------------------------------------------------------------------------
// "Stock Damage" tab — moved as-is from the old standalone StockDamagePage,
// same genuine recordStockDamage/deleteStockDamage backend calls.
// ---------------------------------------------------------------------------
const emptyDamageForm = { stock_id: null as any, quantity: "1", reason: "", damage_date: new Date().toISOString().slice(0, 10) };

function StockDamageTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyDamageForm);
  const isOnline = useOnlineStatus();
  const isOffline = isDesktopApp() && !isOnline;

  const { data: damagesFromApi, isLoading } = useQuery({ queryKey: ["stock-damages"], queryFn: () => getStockDamages() });
  const { data: itemsFromApi } = useQuery({ queryKey: ["items-all"], queryFn: getItems });
  const [offlineDamages, setOfflineDamages] = useState<any[]>([]);
  const [offlineItems, setOfflineItems] = useState<any[]>([]);
  const [pendingDamages, setPendingDamages] = useState<PendingStockDamage[]>([]);

  const refreshPendingDamages = () => {
    if (!isDesktopApp()) return;
    listAllPendingStockDamages().then(setPendingDamages).catch(() => {});
  };

  useEffect(() => {
    if (!isDesktopApp()) return;
    getReferenceData<any[]>("stock_damages").then((v) => v && setOfflineDamages(v)).catch(() => {});
    listOfflineProducts().then((rows) =>
      setOfflineItems(rows.map((r) => ({ stock_id: r.stock_id, description: r.description })))
    ).catch(() => {});
    refreshPendingDamages();
  }, []);

  useEffect(() => {
    if (!isDesktopApp() || !damagesFromApi || damagesFromApi.length === 0) return;
    saveReferenceData("stock_damages", damagesFromApi).catch(() => {});
  }, [damagesFromApi]);

  const items = itemsFromApi && itemsFromApi.length > 0 ? itemsFromApi : offlineItems;

  const createMutation = useMutation({
    mutationFn: recordStockDamage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-damages"] });
      queryClient.invalidateQueries({ queryKey: ["stock-list"] });
      setOpen(false);
      setForm(emptyDamageForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStockDamage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-damages"] });
      queryClient.invalidateQueries({ queryKey: ["stock-list"] });
    },
  });

  const handleSubmit = async () => {
    if (!form.stock_id) return;

    if (isOffline) {
      await queuePendingStockDamage({
        uuid: crypto.randomUUID(),
        terminal_id: getOrCreateTerminalId(),
        stock_id: form.stock_id.stock_id,
        description: form.stock_id.description ?? null,
        quantity: Number(form.quantity) || 0,
        reason: form.reason || null,
        damage_date: form.damage_date,
        created_at: new Date().toISOString(),
      });
      notify.success("Damage recorded offline — it will sync automatically once the connection is back");
      setOpen(false);
      setForm(emptyDamageForm);
      refreshPendingDamages();
      return;
    }

    createMutation.mutate({
      stock_id: form.stock_id.stock_id,
      quantity: Number(form.quantity) || 0,
      reason: form.reason,
      damage_date: form.damage_date,
    });
  };

  const handleDelete = async (row: any) => {
    if (row._offlinePending) {
      await deletePendingStockDamage(row._uuid);
      refreshPendingDamages();
      return;
    }
    if (isOffline) {
      notify.error("Can't delete a synced damage record while offline");
      return;
    }
    deleteMutation.mutate(row.id);
  };

  // Offline: show whatever was synced down last, plus anything queued
  // locally on top (clearly marked, since it hasn't reached the server yet).
  const damages = isOffline
    ? [
        ...pendingDamages.map((d) => ({
          id: d.uuid, stock: { description: d.description }, stock_id: d.stock_id,
          quantity: d.quantity, reason: d.reason, damage_date: d.damage_date,
          _offlinePending: true, _uuid: d.uuid, _syncFailed: !!d.sync_error,
        })),
        ...offlineDamages,
      ]
    : (damagesFromApi ?? []);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {isOffline ? (
          <Chip label="Offline — showing the last synced list + anything recorded locally" color="warning" size="small" />
        ) : <span />}
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Record Damage</Button>
      </Box>

      {isLoading && !isOffline ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(damages ?? []).map((d: any) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.stock?.description ?? d.stock_id}</TableCell>
                  <TableCell align="right">{d.quantity}</TableCell>
                  <TableCell>{d.reason ?? "—"}</TableCell>
                  <TableCell>{String(d.damage_date).slice(0, 10)}</TableCell>
                  <TableCell align="center">
                    {d._offlinePending ? (
                      <Chip size="small" color={d._syncFailed ? "error" : "warning"} label={d._syncFailed ? "Sync failed" : "Pending sync"} />
                    ) : (
                      <Chip size="small" color="success" label="Synced" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDelete(d)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(!damages || damages.length === 0) && (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2">No damaged stock recorded.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Stock Damage</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={items ?? []}
              getOptionLabel={(i: any) => i.description ?? i.stock_id ?? ""}
              value={form.stock_id}
              onChange={(_, val) => setForm({ ...form, stock_id: val })}
              renderInput={(params) => <TextField {...params} label="Product" />}
            />
            <TextField label="Quantity Damaged" type="number" fullWidth value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <TextField label="Reason" fullWidth value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <TextField label="Damage Date" type="date" fullWidth value={form.damage_date} onChange={(e) => setForm({ ...form, damage_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.stock_id || createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Expanded row: full product details + an "Adjust Stock" action.
// ---------------------------------------------------------------------------
function ProductDetailPanel({ product }: { product: any }) {
  const { formatCurrency } = useHomeCurrency();
  const queryClient = useQueryClient();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [locCode, setLocCode] = useState("");
  const [movementType, setMovementType] = useState<"add" | "reduce" | "override">("add");
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("");

  const { data: locations } = useQuery({ queryKey: ["inventory-locations"], queryFn: getInventoryLocations, enabled: adjustOpen });
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["stock-adjustments", product.stock_id],
    queryFn: () => getStockAdjustments(product.stock_id),
    enabled: historyOpen,
  });

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

      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={() => setAdjustOpen(true)}>
          Adjust Stock
        </Button>
        <Tooltip title="Adjustment History">
          <IconButton size="small" onClick={() => setHistoryOpen(true)}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Adjustment History — {product.description}</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Before</TableCell>
                    <TableCell align="right">Moved</TableCell>
                    <TableCell align="right">After</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(history ?? []).map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell>{String(h.created_at).slice(0, 16).replace("T", " ")}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={h.movement_type}
                          color={h.movement_type === "add" ? "success" : h.movement_type === "reduce" ? "error" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">{h.quantity_before}</TableCell>
                      <TableCell align="right">{Number(h.quantity_moved) > 0 ? `+${h.quantity_moved}` : h.quantity_moved}</TableCell>
                      <TableCell align="right">{h.quantity_after}</TableCell>
                      <TableCell>{h.reason ?? "—"}</TableCell>
                      <TableCell>
                        {h.recorded_by_user
                          ? `${h.recorded_by_user.first_name} ${h.recorded_by_user.last_name}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!history || history.length === 0) && (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2">No adjustments recorded for this item.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
