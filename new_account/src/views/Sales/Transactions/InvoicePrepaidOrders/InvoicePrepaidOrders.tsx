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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInventoryLocations } from "../../../../api/InventoryLocation/InventoryLocationApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { resolveTransactionCurrencyCode } from "../../../../utils/relationId";
import { formatTransactionMoney } from "../../../../utils/transactionMoney";
import { getItemCategories } from "../../../../api/ItemCategories/ItemCategoriesApi";
import { getSalesOrders } from "../../../../api/SalesOrders/SalesOrdersApi";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSalesOrderDetails } from "../../../../api/SalesOrders/SalesOrderDetailsApi";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import {
  requiresOrderPrepayment,
  salesOrderPrepAmount,
} from "../../../../utils/paymentTermHelpers";

interface Row {
  id: number;
  deliveryNo: string;
  customer: string;
  branch: string;
  contact: string;
  reference: string;
  custRef: string;
  deliveryDate: string;
  dueBy: string;
  deliveryTotal: string | number;
  // optional fields for order mapping
  deliveryTo?: string;
  orderNo?: string;
  orderTotal?: string | number;
  currency: string;
  isInvoiced?: boolean;
  prepAmount?: number;
  prepPaid?: number;
  prepLeft?: number;
  canFinalInvoice?: boolean;
}

export default function InvoicePrepaidOrders() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // lookups
  const { data: locations = [] } = useQuery({ queryKey: ["inventoryLocations"], queryFn: getInventoryLocations });
  const { data: items = [] } = useQuery({ queryKey: ["items"], queryFn: getItems });
  const { data: categories = [] } = useQuery({ queryKey: ["itemCategories"], queryFn: () => getItemCategories() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: salesOrders = [] } = useQuery({ queryKey: ["salesOrders"], queryFn: getSalesOrders });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => getBranches() });
  const { data: paymentTerms = [] } = useQuery({ queryKey: ["paymentTerms"], queryFn: getPaymentTerms });
  const { data: salesOrderDetails = [] } = useQuery({ queryKey: ["salesOrderDetails"], queryFn: getSalesOrderDetails });

  // header/state
  const [numberText, setNumberText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [location, setLocation] = useState("ALL_LOCATIONS");
  const [itemCode, setItemCode] = useState("");
  const [selectedItem, setSelectedItem] = useState("ALL_ITEMS");
  const [selectedCustomer, setSelectedCustomer] = useState("ALL_CUSTOMERS");

  useEffect(() => {
    if (!selectedItem) {
      setItemCode("");
      return;
    }
    const it = (items || []).find((i: any) => String(i.stock_id ?? i.id) === String(selectedItem));
    setItemCode(it ? String(it.stock_id ?? it.id ?? "") : "");
  }, [selectedItem, items]);

  // Prepaid / cash sales orders eligible for prepayment invoicing
  const rows: Row[] = salesOrders
    .filter((so: any) => {
      if (Number(so.trans_type) !== 30) return false;
      if (String(so.reference ?? "").toLowerCase() === "auto") return false;
      if (
        selectedCustomer !== "ALL_CUSTOMERS" &&
        String(so.debtor_no) !== String(selectedCustomer)
      ) {
        return false;
      }
      if (
        selectedItem !== "ALL_ITEMS" &&
        !salesOrderDetails.some(
          (detail: any) =>
            String(detail.order_no) === String(so.order_no) &&
            String(detail.stk_code) === String(selectedItem)
        )
      ) {
        return false;
      }
      if (numberText && !String(so.order_no).includes(numberText)) return false;
      if (
        referenceText &&
        !String(so.reference ?? "")
          .toLowerCase()
          .includes(referenceText.toLowerCase())
      ) {
        return false;
      }
      if (fromDate && so.ord_date < fromDate) return false;
      if (toDate && so.ord_date > toDate) return false;
      if (location !== "ALL_LOCATIONS" && so.from_stk_loc !== location) return false;

      const prepRequired =
        Number(so.prep_amount) > 0 ||
        requiresOrderPrepayment(paymentTerms, so.payment_terms);
      return prepRequired;
    })
    .map((so: any) => {
      const customer = customers.find(
        (c: any) => String(c.debtor_no) === String(so.debtor_no)
      );
      const branch = branches.find(
        (b: any) => String(b.branch_code) === String(so.branch_code)
      );
      const prepAmount =
        Number(so.prep_amount) > 0
          ? Number(so.prep_amount)
          : salesOrderPrepAmount(paymentTerms, so.payment_terms, Number(so.total ?? 0));
      const prepPaid = Number(so.alloc ?? 0);
      const prepLeft = Math.max(0, prepAmount - prepPaid);
      const lineDetails = salesOrderDetails.filter(
        (d: any) => String(d.order_no) === String(so.order_no)
      );
      const isInvoiced =
        lineDetails.length > 0 &&
        lineDetails.every((d: any) => Number(d.invoiced) === 1);

      return {
        id: so.order_no,
        deliveryNo: so.order_no,
        customer: customer?.name || so.debtor_no,
        branch: branch?.br_name || so.branch_code,
        contact: "",
        reference: so.reference,
        custRef: so.customer_ref || "",
        deliveryDate: so.ord_date,
        dueBy: so.delivery_date,
        deliveryTotal: so.total,
        currency: resolveTransactionCurrencyCode(customer),
        deliveryTo: so.deliver_to || "",
        orderNo: so.order_no,
        orderTotal: so.total,
        isInvoiced,
        prepAmount,
        prepPaid,
        prepLeft,
        canFinalInvoice: !isInvoiced && prepAmount > 0 && prepLeft <= 0.001,
      };
    });

  const paginatedRows = React.useMemo(() => {
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
          <PageTitle title="Invoicing Prepayment Orders" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Invoicing Prepayment Orders" }]} />
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
                    <MenuItem key={item.stock_id ?? item.id} value={String(item.stock_id ?? item.id)}>{item.description ?? item.item_name ?? item.name}</MenuItem>
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
              <TableCell>Prep Required</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Actions</TableCell>
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
                <TableCell>{r.deliveryDate}</TableCell>
                <TableCell>{r.dueBy}</TableCell>
                <TableCell>{r.deliveryTo}</TableCell>
                <TableCell>{formatTransactionMoney(r.orderTotal ?? r.deliveryTotal, r.currency)}</TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell>{formatTransactionMoney(r.prepAmount ?? 0, r.currency)}</TableCell>
                <TableCell>{formatTransactionMoney(r.prepPaid ?? 0, r.currency)}</TableCell>
                <TableCell>{formatTransactionMoney(r.prepLeft ?? 0, r.currency)}</TableCell>
                <TableCell>
                  {!r.isInvoiced && (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!r.canFinalInvoice}
                      title={
                        r.canFinalInvoice
                          ? "Issue final invoice"
                          : Number(r.prepLeft ?? 0) > 0
                            ? "Record customer payment allocated to this order first"
                            : "Not ready for final invoice"
                      }
                      onClick={() =>
                        navigate(
                          "/sales/transactions/invoice-prepaid-orders/final-invoice-entry",
                          { state: { orderNo: r.orderNo } }
                        )
                      }
                    >
                      Final Invoice
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={14}
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
