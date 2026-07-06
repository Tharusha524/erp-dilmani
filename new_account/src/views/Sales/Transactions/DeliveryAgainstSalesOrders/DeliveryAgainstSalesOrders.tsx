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
  TableFooter,
  TablePagination,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Grid,
  useMediaQuery,
  Theme,
  FormControl,
  InputLabel,
  Select,
  ListSubheader,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getSalesOrders } from "../../../../api/SalesOrders/SalesOrdersApi";
import { getSalesOrderDetails } from "../../../../api/SalesOrders/SalesOrderDetailsApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import CustomerCurrencyField from "../../../../components/CustomerCurrencyField";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import { resolveTransactionCurrencyCode } from "../../../../utils/relationId";
import { useHomeCurrency } from "../../../../hooks/useHomeCurrency";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";

interface Row {
  id: number;
  orderNo: string;
  ref: string;
  customer: string;
  branch: string;
  custOrderRef: string;
  orderDate: string;
  requiredBy: string;
  deliveryTo: string;
  orderTotal: number | string;
  currency: string;
}

export default function DeliveryAgainstSalesOrders() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const { code: homeCurrencyCode } = useHomeCurrency();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch lookup data
  const { data: locations = [] } = useQuery<any[]>({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: items = [] } = useQuery<any[]>({ queryKey: ["items"], queryFn: getItems });
  const { data: customers = [] } = useQuery<any[]>({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["itemCategories"], queryFn: () => getItemCategories() });
  const { data: salesOrders = [] } = useQuery<any[]>({ queryKey: ["salesOrders"], queryFn: () => getSalesOrders() });
  const { data: salesOrderDetails = [] } = useQuery<any[]>({ queryKey: ["salesOrderDetails"], queryFn: () => getSalesOrderDetails() });
  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["custBranches"], queryFn: () => getBranches() });

  // Header fields
  const [numberText, setNumberText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [location, setLocation] = useState("ALL_LOCATIONS");
  const [selectedItem, setSelectedItem] = useState("ALL_ITEMS");
  const [itemCode, setItemCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");

  const filterCustomer = React.useMemo(
    () =>
      selectedCustomer !== "ALL_CUSTOMERS"
        ? (customers || []).find((c: any) => String(c.debtor_no) === String(selectedCustomer))
        : null,
    [customers, selectedCustomer]
  );
  const filterCustomerCurrency = resolveTransactionCurrencyCode(filterCustomer, homeCurrencyCode);

  // Filter sales orders according to header selections (including details table for item filter)
  const filteredSalesOrders = React.useMemo(() => {
    if (!salesOrders || salesOrders.length === 0) return [] as any[];

    return (salesOrders as any[]).filter((s: any) => {
      // Ensure it's a sales order (trans_type = 30)
      if (Number(s.trans_type) !== 30) return false;

      // Exclude orders with reference 'auto'
      if (String(s.reference ?? s.ref ?? "").toLowerCase() === 'auto') return false;

      // Exclude template orders
      if (Number(s.type) === 1) return false;

      const orderNoVal = s.order_no ?? s.orderNo ?? s.order_number;
      const hasOutstanding = (salesOrderDetails || []).some((d: any) => {
        if (String(d.order_no) !== String(orderNoVal)) return false;
        const qty = Number(d.quantity ?? 0);
        const sent = Number(d.qty_sent ?? 0);
        return qty - sent > 0.0001;
      });
      if (!hasOutstanding) return false;

      // numberText (#) - match order_no (contains)
      if (numberText && String(s.order_no ?? s.orderNo ?? "").indexOf(numberText) === -1) return false;

      // referenceText (ref) - match reference contains
      if (referenceText && String(s.reference ?? s.ref ?? "").indexOf(referenceText) === -1) return false;

      // location - match from_stk_loc field on sales_order
      if (location && location !== "ALL_LOCATIONS") {
        if (String(s.from_stk_loc ?? s.from_location ?? s.location ?? "") !== String(location)) return false;
      }

      // customer selection - match debtor_no
      if (selectedCustomer && selectedCustomer !== "ALL_CUSTOMERS") {
        if (String(s.debtor_no ?? s.customer_id ?? "") !== String(selectedCustomer)) return false;
      }

      // selectedItem - need to check sales_order_details table
      if (selectedItem && selectedItem !== "ALL_ITEMS") {
        // find any detail record for this order with matching stk_code
        const hasItem = (salesOrderDetails || []).some((d: any) => String(d.order_no) === String(s.order_no ?? s.orderNo ?? d.order_no) && String(d.stk_code ?? d.stock_id ?? d.stkId ?? "") === String(selectedItem));
        if (!hasItem) return false;
      }

      return true;
    });
  }, [salesOrders, salesOrderDetails, numberText, referenceText, location, selectedCustomer, selectedItem]);

  // Map filtered sales orders into table rows
  const rows: Row[] = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (filteredSalesOrders || []).map((s: any, idx: number) => {
      const cust = (customers || []).find((c: any) => String(c.debtor_no) === String(s.debtor_no));
      const br = (branches || []).find((b: any) => String(b.branch_code) === String(s.branch_code));

      return {
        id: s.order_no ?? s.orderNo ?? s.order_number ?? idx,
        orderNo: s.order_no ?? s.orderNo ?? s.order_number ?? "",
        ref: s.reference ?? s.ref ?? "",
        customer: cust ? (cust.name ?? cust.customer_name ?? cust.debtor_name ?? String(s.debtor_no)) : (s.debtor_no ?? ""),
        branch: br ? (br.br_name ?? br.branch_name ?? String(s.branch_code)) : (s.branch_code ?? ""),
        custOrderRef: s.customer_ref ?? s.cust_ref ?? "",
        orderDate: s.ord_date ?? s.order_date ?? today,
        requiredBy: s.delivery_date ?? s.required_by ?? "",
        deliveryTo: s.deliver_to ?? s.delivery_to ?? "",
        orderTotal: (s.total ?? s.order_total ?? 0),
        currency: resolveTransactionCurrencyCode(cust, homeCurrencyCode),
      } as Row;
    });
  }, [filteredSalesOrders, customers, branches, homeCurrencyCode]);

  const paginatedRows = React.useMemo(() => {
    if (rowsPerPage === -1) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // When select item changes, set item code value if available
  useEffect(() => {
    if (!selectedItem) {
      setItemCode("");
      return;
    }
    const it = (items || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    if (it) {
      setItemCode(String(it.stock_id ?? it.id ?? ""));
    } else {
      setItemCode("");
    }
  }, [selectedItem, items]);

  return (
    <Stack spacing={2}>
      <Box sx={{ padding: theme.spacing(2), boxShadow: 2, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <PageTitle title="Search Outstanding Sales Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Delivery Against Sales Orders" }]} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" label="#" value={numberText} onChange={(e) => setNumberText(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Ref" value={referenceText} onChange={(e) => setReferenceText(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="td-location-label">Location</InputLabel>
              <Select labelId="td-location-label" value={location} label="Location" onChange={(e) => setLocation(String(e.target.value))}>
                <MenuItem value="ALL_LOCATIONS">All Locations</MenuItem>
                {(locations || []).map((loc: any) => (
                  <MenuItem key={loc.loc_code} value={loc.loc_code}>{loc.location_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" label="Item Code" value={itemCode} InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="td-item-label">Select Item</InputLabel>
              <Select labelId="td-item-label" value={selectedItem ?? ""} label="Select Item" onChange={(e) => setSelectedItem(String(e.target.value))}>
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
                    <MenuItem key={item.stock_id ?? item.id} value={String(item.stock_id ?? item.id)}>{item.description ?? item.item_name ?? item.name}</MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="td-customer-label">Select Customer</InputLabel>
                    <Select labelId="td-customer-label" value={selectedCustomer ?? ""} label="Select Customer" onChange={(e) => setSelectedCustomer(String(e.target.value))}>
                      <MenuItem value="ALL_CUSTOMERS">All Customers</MenuItem>
                      {(customers || []).map((c: any) => (
                        <MenuItem key={c.debtor_no} value={String(c.debtor_no)}>{c.name ?? c.customer_name ?? c.debtor_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Button variant="contained" startIcon={<SearchIcon />} onClick={() => console.log("TemplateDelivery search", selectedCustomer)} sx={{ whiteSpace: "nowrap" }}>
                  Search
                </Button>
              </Box>
              {selectedCustomer !== "ALL_CUSTOMERS" ? (
                <Box sx={{ mt: 1, maxWidth: 280 }}>
                  <CustomerCurrencyField customer={filterCustomer} currencyCode={filterCustomerCurrency} />
                </Box>
              ) : null}
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>No</TableCell>
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
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={row.id} hover>
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>{row.orderNo}</TableCell>
                <TableCell>{row.ref}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell>{row.branch}</TableCell>
                <TableCell>{row.custOrderRef}</TableCell>
                <TableCell>{row.orderDate}</TableCell>
                <TableCell>{row.requiredBy}</TableCell>
                <TableCell>{row.deliveryTo}</TableCell>
                <TableCell>{formatTransactionMoney(row.orderTotal, row.currency)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => navigate("/sales/transactions/update-sales-order-entry", { state: { id: row.id } })}>Edit</Button>
                    <Button variant="contained" color="secondary" size="small" startIcon={<LocalShippingIcon />} onClick={() => navigate("/sales/transactions/customer-delivery", { state: { orderNo: row.orderNo } })}>Dispatch</Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() =>
                        navigate("/sales/transactions/sales-order-entry/view-sales-order", {
                          state: { orderNo: row.orderNo, autoPrint: true },
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
    </Stack>
  );
}
