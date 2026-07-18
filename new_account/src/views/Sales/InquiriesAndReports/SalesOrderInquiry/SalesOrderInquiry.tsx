import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
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
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSalesOrderInquiry } from "../../../../api/SalesInquiry/SalesInquiryApi";
import { updateSalesOrder } from "../../../../api/SalesOrders/SalesOrdersApi";
import { getSalesOrderDetails } from "../../../../api/SalesOrders/SalesOrderDetailsApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  deliveryNo: string;
  customer: string;
  branch: string;
  contact: string;
  reference: string;
  custRef: string;
  orderDate: string;
  requiredBy: string;
  deliveryTotal: string | number;
  // optional fields for order mapping
  deliveryTo?: string;
  orderNo?: string;
  orderTotal?: string | number;
  currency: string;
  trans_type?: number;
  prep_amount?: number;
}

export default function SalesOrderInquiry() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // map to hold new payment values per row id
  const [payments, setPayments] = useState<Record<number, string>>({});

  // lookups
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: categories = [] } = useQuery({ queryKey: ["itemCategories"], queryFn: () => getItemCategories() });

  // header/state
  const [numberText, setNumberText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [location, setLocation] = useState("ALL_LOCATIONS");
  const [itemCode, setItemCode] = useState("");
  const [selectedItem, setSelectedItem] = useState("ALL_ITEMS");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");
  const [applied, setApplied] = useState({
    selectedCustomer: "ALL_CUSTOMERS",
    numberText: "",
    referenceText: "",
    fromDate: "",
    toDate: "",
    location: "ALL_LOCATIONS",
    itemCode: "",
    selectedItem: "ALL_ITEMS",
  });

  const handleSearch = () => {
    setApplied({
      selectedCustomer,
      numberText,
      referenceText,
      fromDate,
      toDate,
      location,
      itemCode,
      selectedItem,
    });
    setPage(0);
  };

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => getBranches() });

  useEffect(() => {
    if (!selectedItem) {
      setItemCode("");
      return;
    }
    const it = (items || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    setItemCode(it ? String(it.stock_id ?? it.id ?? "") : "");
  }, [selectedItem, items]);

  const inquiryParams = React.useMemo(() => ({
    ...(applied.selectedCustomer !== "ALL_CUSTOMERS" ? { debtor_no: Number(applied.selectedCustomer) } : {}),
    ...(applied.numberText ? { order_no: Number(applied.numberText) || undefined } : {}),
    ...(applied.referenceText ? { reference: applied.referenceText } : {}),
    ...(applied.fromDate ? { from_date: applied.fromDate } : {}),
    ...(applied.toDate ? { to_date: applied.toDate } : {}),
    ...(applied.location !== "ALL_LOCATIONS" ? { from_stk_loc: applied.location } : {}),
    ...(applied.itemCode.trim() ? { stk_code: applied.itemCode.trim() } : {}),
    ...(applied.selectedItem !== "ALL_ITEMS" ? { stk_code: applied.selectedItem } : {}),
    limit: 500,
  }), [applied]);

  const queryClient = useQueryClient();
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["salesOrderInquiry", inquiryParams],
    queryFn: () => getSalesOrderInquiry(inquiryParams),
  });
  const { data: orderDetails = [] } = useQuery({
    queryKey: ["salesOrderDetails"],
    queryFn: getSalesOrderDetails,
  });

  // Initialize tmplSelected based on order.type
  useEffect(() => {
    const initialTmpl: Record<number, boolean> = {};
    (salesOrders || []).forEach((order: any) => {
      if (Number(order.type) === 1) {
        initialTmpl[order.order_no] = true;
      }
    });
    setTmplSelected(initialTmpl);
  }, [salesOrders]);

  // Apply server-filtered orders and map to rows
  const rows: Row[] = (salesOrders || []).map((order: any) => {
    const customer = (customers || []).find((c: any) => c.debtor_no === order.debtor_no);
    const branchObj = (branches || []).find((b: any) => String(b.branch_code) === String(order.branch_code));
    return {
      id: order.order_no,
      deliveryNo: String(order.order_no),
      customer: order.customer_name ?? customer?.name ?? String(order.debtor_no),
      branch: order.branch_name ?? branchObj?.br_name ?? String(order.branch_code ?? ""),
      contact: "",
      reference: order.reference ?? "",
      custRef: order.customer_ref || "",
      orderDate: order.ord_date || "",
      requiredBy: order.delivery_date || "",
      deliveryTotal: order.total ?? 0,
      currency: customer?.curr_code,
      deliveryTo: order.deliver_to || "",
      orderNo: String(order.order_no),
      orderTotal: order.total ?? 0,
      trans_type: Number(order.trans_type),
      prep_amount: Number(order.prep_amount) || 0,
    };
  });

  const paginatedRows = React.useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const [tmplSelected, setTmplSelected] = React.useState<Record<number, boolean>>({});

  const toggleTmpl = async (id: number) => {
    const currently = !!tmplSelected[id];
    // optimistic UI
    setTmplSelected((prev) => ({ ...prev, [id]: !currently }));

    // find the underlying sales order
    const order = (salesOrders || []).find((o: any) => Number(o.order_no) === Number(id));
    if (!order) {
      // revert
      setTmplSelected((prev) => ({ ...prev, [id]: currently }));
      alert("Order not found to update template flag");
      return;
    }

    const newType = currently ? 0 : 1;
    const payload = { ...order, type: newType };

    try {
      await updateSalesOrder(Number(id), payload as any);
      await queryClient.invalidateQueries({ queryKey: ["salesOrderInquiry"] });
      await queryClient.invalidateQueries({ queryKey: ["templateDeliveryOrders"] });
      await queryClient.invalidateQueries({ queryKey: ["templateInvoiceOrders"] });
      await queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    } catch (err) {
      console.error("Failed to update sales order type", err);
      // revert
      setTmplSelected((prev) => ({ ...prev, [id]: currently }));
      alert("Failed to update order template flag. See console for details.");
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // returns true if every detail for the given order has qty_sent >= quantity
  const isFullyDispatched = (orderId: number) => {
    const detailsForOrder = (orderDetails || []).filter((d: any) => Number(d.order_no) === Number(orderId));
    if (detailsForOrder.length === 0) return true;
    return detailsForOrder.every((d: any) => Number(d.qty_sent || 0) >= Number(d.quantity || 0));
  };

  return (
    <FormPageLayout>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Search All Sales Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Inquiries and Reports", href: "/sales/inquiriesandreports" }, { title: "Search All Sales Orders" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2} md={1}>
            <TextField fullWidth size="small" label="#" value={numberText} onChange={(e) => setNumberText(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={3} md={2}>
            <TextField fullWidth size="small" label="Ref" value={referenceText} onChange={(e) => setReferenceText(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={5} md={3}>
            <TextField fullWidth size="small" label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} sm={5} md={3}>
            <TextField fullWidth size="small" label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} sm={3} md={2}>
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

          <Grid item xs={12} sm={3} md={2}>
            <TextField fullWidth size="small" label="Item Code" value={itemCode} InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="iasd-item-label">Select Item</InputLabel>
              <Select labelId="iasd-item-label" value={selectedItem ?? ""} label="Select Item" onChange={(e) => setSelectedItem(String(e.target.value))}>
                <MenuItem value="ALL_ITEMS">All Items</MenuItem>
                {Object.entries(
                  items.reduce((acc: any, item: any) => {
                    const category = categories.find((c: any) => c.category_id === item.category_id)?.description || "Uncategorized";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([category, catItems]: [string, any[]]) => [
                  <ListSubheader key={category}>{category}</ListSubheader>,
                  ...catItems.map((item: any) => (
                    <MenuItem key={item.stock_id ?? item.id} value={String(item.stock_id ?? item.id)}>
                      {item.description ?? item.item_name ?? item.name}
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="iasd-customer-label">Select Customer</InputLabel>
              <Select labelId="iasd-customer-label" value={selectedCustomer ?? ""} label="Select Customer" onChange={(e) => setSelectedCustomer(String(e.target.value))}>
                <MenuItem value="ALL_CUSTOMERS">All Customers</MenuItem>
                {(customers || []).map((c: any) => (
                  <MenuItem key={c.debtor_no} value={String(c.debtor_no)}>
                    {c.name ?? c.customer_name ?? c.debtor_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={1}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Ref</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Cust Order Ref</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Required By</TableCell>
              <TableCell>Delivery To</TableCell>
              <TableCell>Order Total</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Tmpl</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.orderNo ?? r.deliveryNo}</TableCell>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.customer}</TableCell>
                <TableCell>{r.branch}</TableCell>
                <TableCell>{r.custRef}</TableCell>
                <TableCell>{r.orderDate}</TableCell>
                <TableCell>{r.requiredBy}</TableCell>
                <TableCell>{r.deliveryTo}</TableCell>
                <TableCell>{formatTransactionMoney(r.orderTotal ?? r.deliveryTotal, r.currency)}</TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell>
                  {Number(r.trans_type) !== 32 && Number(r.prep_amount || 0) === 0 ? (
                    <Checkbox
                      checked={!!tmplSelected[r.id]}
                      onChange={() => toggleTmpl(r.id)}
                      inputProps={{ 'aria-label': `tmpl-${r.id}` }}
                    />
                  ) : null}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                    {Number(r.prep_amount || 0) === 0 && (
                      <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => navigate(`/sales/transactions/update-sales-order-entry`, { state: { id: r.id } })}>
                        Edit
                      </Button>
                    )}

                    {String(r.reference ?? "").toLowerCase() !== "auto" && !isFullyDispatched(r.id) && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => navigate("/sales/transactions/customer-delivery", { state: { orderNo: r.id, reference: r.reference } })}
                      >
                        Dispatch
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() =>
                        navigate("/sales/transactions/sales-order-entry/view-sales-order", {
                          state: { orderNo: r.id, autoPrint: true },
                        })
                      }
                    >
                      Print
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={12}
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
