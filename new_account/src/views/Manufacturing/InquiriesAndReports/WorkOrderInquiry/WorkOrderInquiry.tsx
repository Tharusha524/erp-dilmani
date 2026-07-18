import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
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
  TableFooter,
  TablePagination,
  Paper,
  TextField,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  ListSubheader,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { searchWorkOrders, WorkOrderSearchParams } from "../../../../api/WorkOrders/WorkOrderApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { resolveWorkOrderItemLabel, resolveWorkOrderLocationLabel } from "../../../../utils/workOrderDisplay";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  reference: string;
  type: string;
  location: string;
  item: string;
  stock_id?: string | number;
  required: number;
  manufactured: number;
  date: string;
  requiredBy: string;
  closed?: number | boolean | string;
  released?: number | boolean | string;
  isOverdue?: boolean;
}

export default function WorkOrderInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [numberText, setNumberText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [location, setLocation] = useState("ALL_LOCATIONS");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [selectedItem, setSelectedItem] = useState("ALL_ITEMS");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchParams, setSearchParams] = useState<WorkOrderSearchParams>({});

  // Queries
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: categories = [] } = useQuery<{ category_id: number; description: string }[]>({
    queryKey: ["itemCategories"],
    queryFn: () => getItemCategories() as Promise<{ category_id: number; description: string }[]>,
  });

  const filteredItems = (items || []).filter((it: any) => {
    const flag = it.mb_flag ?? it.mbFlag ?? it.mb ?? 0;
    return Number(flag) === 1;
  });

  useEffect(() => {
    if (selectedItem === "ALL_ITEMS") {
      setItemCode("");
      return;
    }
    const it = (filteredItems || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    setItemCode(it ? String(it.stock_id ?? it.id ?? "") : "");
  }, [selectedItem, filteredItems]);

  const { data: workOrders = [], isFetching, refetch } = useQuery({
    queryKey: ["workOrdersInquiry", searchParams],
    queryFn: () => searchWorkOrders(searchParams),
    refetchOnMount: "always",
  });

  const getTypeLabel = (t: any) => {
    const n = Number(t);
    if (n === 0) return "Assemble";
    if (n === 1) return "Unassemble";
    if (n === 2) return "Advanced Manufacture";
    return String(t ?? "");
  };

  const rows: Row[] = useMemo(() => {
    if (!Array.isArray(workOrders)) return [];

    return workOrders.map((w: any, idx: number) => ({
        id: w.id ?? idx + 1,
        reference: w.wo_ref ?? "",
        type: getTypeLabel(w.type),
        location: resolveWorkOrderLocationLabel(w, locations),
        item: resolveWorkOrderItemLabel(w, items),
        stock_id: w.stock_id ?? "",
        required: Number(w.units_reqd ?? 0),
        manufactured: Number(w.units_issued ?? 0),
        date: w.date ? String(w.date).split("T")[0] : "",
        requiredBy: w.required_by ? String(w.required_by).split("T")[0] : "",
        closed: w.closed,
        released: w.released,
        isOverdue: Boolean(w.is_overdue),
      } as Row));
  }, [workOrders, items, locations]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filtersLocked = Boolean(numberText.trim());

  const handleSearch = () => {
    const params: WorkOrderSearchParams = {};
    const orderNo = numberText.trim();
    if (orderNo) {
      params.order_no = orderNo;
    } else {
      if (referenceText.trim()) params.reference = referenceText.trim();
      if (location !== "ALL_LOCATIONS") params.loc_code = location;
      if (selectedItem && selectedItem !== "ALL_ITEMS") params.stock_id = selectedItem;
      if (onlyOverdue) params.overdue_only = true;
      if (onlyOpen) params.open_only = true;
    }
    setSearchParams(params);
    setPage(0);
    refetch();
  };

  const handleGL = (id: number, reference?: string) => {
    navigate("/manufacturing/transactions/work-order-entry/view-gl-journal-entries", { state: { reference } });
  };

  const handleEdit = (id: number) => {
    navigate("/manufacturing/transactions/work-order-entry/update", { state: { id } });
  };

  const handlePrint = (id: number) => {
    console.log("Print for", id);
  };

  const handleRelease = (id: number, reference?: string) => {
    navigate("/manufacturing/transactions/outstanding-work-orders/release", { state: { id, reference, action: "release" } });
  };

  const handleIssue = (id: number) => {
    navigate("/manufacturing/transactions/outstanding-work-orders/issue", { state: { id, action: "issue" } });
  };

  const handleCosts = (id: number) => {
    navigate("/manufacturing/transactions/outstanding-work-orders/costs", { state: { id, action: "costs" } });
  };

  const handleProduce = (id: number) => {
    navigate("/manufacturing/transactions/outstanding-work-orders/produce", { state: { id, action: "produce" } });
  };

  return (
    <FormPageLayout>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Search Work Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Inquiries and Reports", href: "/manufacturing/inquiriesandreports" }, { title: "Work Order Inquiry" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2} md={3}>
            <TextField fullWidth size="small" label="#" value={numberText} onChange={(e) => setNumberText(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            <TextField fullWidth size="small" label="Reference" value={referenceText} onChange={(e) => setReferenceText(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <FormControlLabel control={<Checkbox checked={onlyOverdue} disabled={filtersLocked} onChange={(e) => setOnlyOverdue(e.target.checked)} />} label="Only overdue" />
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <FormControlLabel control={<Checkbox checked={onlyOpen} disabled={filtersLocked} onChange={(e) => setOnlyOpen(e.target.checked)} />} label="Only open" />
          </Grid>
        </Grid>

        <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Grid item xs={12} sm={3} md={3}>
            <FormControl fullWidth size="small" disabled={filtersLocked}>
              <InputLabel id="location-label">Location</InputLabel>
              <Select labelId="location-label" value={location} label="Location" onChange={(e) => setLocation(String(e.target.value))}>
                <MenuItem value="ALL_LOCATIONS">All Locations</MenuItem>
                {(locations || []).map((loc: any) => (
                  <MenuItem key={loc.loc_code} value={loc.loc_code}>{loc.location_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            <TextField fullWidth size="small" label="Item Code" value={itemCode} InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small" disabled={filtersLocked}>
              <InputLabel id="item-label">Select Item</InputLabel>
              <Select labelId="item-label" value={selectedItem ?? ""} label="Select Item" onChange={(e) => setSelectedItem(String(e.target.value))}>
                <MenuItem value="ALL_ITEMS">All Items</MenuItem>
                {filteredItems && filteredItems.length > 0 ? (
                  (() => {
                    return Object.entries(
                      filteredItems.reduce((groups: Record<string, any[]>, item) => {
                        const catId = item.category_id || "Uncategorized";
                        if (!groups[catId]) groups[catId] = [];
                        groups[catId].push(item);
                        return groups;
                      }, {} as Record<string, any[]>)
                    ).map(([categoryId, groupedItems]: [string, any[]]) => {
                      const category = categories.find(cat => cat.category_id === Number(categoryId));
                      const categoryLabel = category ? category.description : `Category ${categoryId}`;
                      return [
                        <ListSubheader key={`cat-${categoryId}`}>
                          {categoryLabel}
                        </ListSubheader>,
                        groupedItems.map((item) => {
                          const stockId = item.stock_id ?? item.id ?? item.stock_master_id ?? item.item_id ?? 0;
                          const key = stockId;
                          const label = item.item_name ?? item.name ?? item.description ?? String(stockId);
                          const value = String(stockId);
                          return (
                            <MenuItem key={String(key)} value={value}>
                              {label}
                            </MenuItem>
                          );
                        })
                      ];
                    });
                  })()
                ) : (
                  <MenuItem disabled value="">
                    No items
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={isFetching}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell align="center">#</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Item</TableCell>
              <TableCell>Required</TableCell>
              <TableCell>Manufactured</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Required by</TableCell>
              <TableCell align="center">GL</TableCell>
              <TableCell align="center">Edit</TableCell>
              <TableCell align="center">Actions</TableCell>
              <TableCell align="center">Print</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  {isFetching ? "Searching..." : "No work orders match your search."}
                </TableCell>
              </TableRow>
            ) : (
            paginatedRows.map((r) => (
              <TableRow key={r.id} hover sx={r.isOverdue ? { backgroundColor: "rgba(255, 152, 0, 0.08)" } : undefined}>
                <TableCell>
                  <Button variant="text" color="primary" onClick={() => navigate("/manufacturing/transactions/work-order-entry/view", { state: { id: r.id, reference: r.reference } })}>
                    {r.id}
                  </Button>
                </TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.location}</TableCell>
                <TableCell align="center">
                  {r.item || r.stock_id ? (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() =>
                        navigate("/itemsandinventory/maintenance/reorder-levels", { state: { stock_id: r.stock_id } })
                      }
                    >
                      {r.item || String(r.stock_id)}
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{r.required}</TableCell>
                <TableCell>{r.manufactured}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.requiredBy}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleGL(r.id, r.reference)}>GL</Button>
                </TableCell>
                <TableCell>
                  {(() => {
                    const closedVal = r.closed;
                    const isClosed = closedVal === true || String(closedVal) === "1" || String(closedVal).toLowerCase() === "true";
                    return isClosed ? (
                      <span>Closed</span>
                    ) : (
                      <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleEdit(r.id)}>Edit</Button>
                    );
                  })()}
                </TableCell>

                <TableCell>
                  {(() => {
                    const closedVal = r.closed;
                    const isClosed = closedVal === true || String(closedVal) === "1" || String(closedVal).toLowerCase() === "true";
                    if (isClosed) return null;
                    const rel = r.released;
                    const isReleased = rel === true || String(rel) === "1" || String(rel).toLowerCase() === "true";
                    if (!isReleased) {
                      return (
                        <Button variant="contained" size="small" onClick={() => handleRelease(r.id, r.reference)}>Release</Button>
                      );
                    }
                    return (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Button variant="outlined" size="small" onClick={() => handleIssue(r.id)}>Issue</Button>
                        <Button variant="outlined" size="small" onClick={() => handleCosts(r.id)}>Costs</Button>
                        <Button variant="outlined" size="small" onClick={() => handleProduce(r.id)}>Produce</Button>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => handlePrint(r.id)}>Print</Button>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={13}
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
    </FormPageLayout>
  );
}
