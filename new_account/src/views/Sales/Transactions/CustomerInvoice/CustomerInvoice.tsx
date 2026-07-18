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
  Paper,
  TextField,
  Typography,
  MenuItem,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getPaymentTerms } from "../../../../api/PaymentTerm/PaymentTermApi";
import { getShippingCompanies } from "../../../../api/ShippingCompany/ShippingCompanyApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getSalesTypes } from "../../../../api/SalesMaintenance/salesService";
import { getDebtorTransDetails } from "../../../../api/DebtorTrans/DebtorTransDetailsApi";
import { getItems } from "../../../../api/Item/ItemApi";
import { getItemUnits } from "../../../../api/ItemUnit/ItemUnitApi";
import { getItemTaxTypes } from "../../../../api/ItemTaxType/ItemTaxTypeApi";
import { createDebtorTran, updateDebtorTran } from "../../../../api/DebtorTrans/DebtorTransApi";
import { createDebtorTransDetail } from "../../../../api/DebtorTrans/DebtorTransDetailsApi";
import { getFiscalYears } from "../../../../api/FiscalYear/FiscalYearApi";
import { getCompanies } from "../../../../api/CompanySetup/CompanySetupApi";
import {
  isCashSalePaymentTerm,
  validateCustomerCreditForSale,
} from "../../../../utils/customerCredit";
import { useCustomerCredit } from "../../../../hooks/useCustomerCredit";
import CustomerCreditSummaryFields from "../../../../components/CustomerCreditSummaryFields";
import FormattedNumberField from "../../../../components/FormattedNumberField";

export default function CustomerInvoice() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference: stateReference, date: stateDate } = state || {};

  // === Fields ===
  const [customer, setCustomer] = useState("");
  const [branch, setBranch] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [reference, setReference] = useState(stateReference || "");
  const [salesType, setSalesType] = useState("");
  const [currency, setCurrency] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [date, setDate] = useState(stateDate || new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [memo, setMemo] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [dateError, setDateError] = useState("");

  // === Table Data ===
  const [rows, setRows] = useState([]);

  // === API Queries ===
  const { data: paymentTerms = [] } = useQuery({
    queryKey: ["paymentTerms"],
    queryFn: getPaymentTerms,
  });

  const { data: shippingCompanies = [] } = useQuery({
    queryKey: ["shippingCompanies"],
    queryFn: getShippingCompanies,
  });

  const { data: debtorTrans = [] } = useQuery({
    queryKey: ["debtorTrans"],
    queryFn: getDebtorTrans,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  const { data: salesTypes = [] } = useQuery({
    queryKey: ["salesTypes"],
    queryFn: getSalesTypes,
  });

  const { data: debtorTransDetails = [] } = useQuery({
    queryKey: ["debtorTransDetails"],
    queryFn: getDebtorTransDetails,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  const { data: itemUnits = [] } = useQuery({
    queryKey: ["itemUnits"],
    queryFn: getItemUnits,
  });

  const { data: itemTaxTypes = [] } = useQuery({
    queryKey: ["itemTaxTypes"],
    queryFn: getItemTaxTypes,
  });

  const { data: fiscalYears = [] } = useQuery({
    queryKey: ["fiscalYears"],
    queryFn: getFiscalYears,
  });

  const { data: companyData } = useQuery({
    queryKey: ["company"],
    queryFn: getCompanies,
  });

  // Find selected fiscal year from company setup
  const selectedFiscalYear = useMemo(() => {
    if (!companyData || companyData.length === 0) return null;
    const company = companyData[0];
    return fiscalYears.find((fy: any) => fy.id === company.fiscal_year_id);
  }, [companyData, fiscalYears]);

  // Validate date is within fiscal year
  const validateDate = (selectedDate: string) => {
    if (!selectedFiscalYear) {
      setDateError("No fiscal year selected from company setup");
      return false;
    }

    if (selectedFiscalYear.closed) {
      setDateError("The fiscal year is closed for further data entry.");
      return false;
    }

    const selected = new Date(selectedDate);
    const from = new Date(selectedFiscalYear.fiscal_year_from);
    const to = new Date(selectedFiscalYear.fiscal_year_to);

    if (selected < from || selected > to) {
      setDateError("The entered date is out of fiscal year.");
      return false;
    }

    setDateError("");
    return true;
  };

  // Handle date change with validation
  const handleDateChange = (value: string) => {
    setDate(value);
    validateDate(value);
  };

  // Validate date when fiscal year changes
  useEffect(() => {
    if (selectedFiscalYear) {
      validateDate(date);
    }
  }, [selectedFiscalYear]);

  // Mutations
  const createTransMutation = useMutation({
    mutationFn: createDebtorTran,
  });

  const createDetailMutation = useMutation({
    mutationFn: createDebtorTransDetail,
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    
    if (stateReference && debtorTrans.length > 0 && customers.length > 0) {
      const delivery = debtorTrans.find((d: any) => d.reference === stateReference && d.trans_type === 13);
      if (delivery) {
        const customerData = customers.find((c: any) => String(c.debtor_no) === String(delivery.debtor_no));
        const branchData = branches.find((b: any) => String(b.branch_code) === String(delivery.branch_code));
        const salesTypeData = salesTypes.find((st: any) => String(st.id) === String(delivery.tpe));
        setCustomer(customerData?.name || "Customer not found");
        setBranch(branchData?.br_name || "Branch not found");
        setCurrency(customerData?.curr_code || "Currency not found");
        setSalesType(salesTypeData?.typeName || "Sales type not found");

        // Set rows from delivery details
        const deliveryDetails = debtorTransDetails.filter((dd: any) => dd.debtor_trans_no === delivery.trans_no);
       
        if (deliveryDetails.length > 0) {
          const newRows = deliveryDetails.map((detail: any, index: number) => {
            const itemData = items.find((i: any) => i.stock_id === detail.stock_id);
            const unitData = itemUnits.find((u: any) => u.id === itemData?.units);
            const unitName = unitData?.abbr || detail.units || "";
            const price = parseFloat(detail.unit_price || 0);
            const qty = parseFloat(detail.quantity || 0);
            const taxTypeData = itemTaxTypes.find((t: any) => String(t.id) === String(itemData?.tax_type_id));
            const taxRate = parseFloat(taxTypeData?.rate || 15);
            const unitTax = price * (taxRate / 100);
            const total = 1 * price;
            const standardCost = parseFloat(itemData?.standard_cost || 0);

            return {
              id: index + 1,
              itemCode: detail.stock_id || "",
              description: detail.description || "",
              delivered: qty,
              units: unitName,
              invoiced: 0, // assuming no previous invoices
              thisInvoice: 1,
              price: price,
              taxType: taxTypeData?.name,
              discount: parseFloat(detail.discount_percent || 0),
              total: total,
              src_id: detail.src_id,
              unitTax: unitTax,
              standardCost: standardCost,
            };
          });
          setRows(newRows);
        } else {
          setRows([]);
        }
      } else {
        setRows([]);
      }
    }
  }, [stateReference, debtorTrans, customers, branches, salesTypes, debtorTransDetails, items, itemUnits, itemTaxTypes]);

  // === Calculations ===
  const subTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const invoiceTotal = subTotal + shippingCost;

  const deliveryDebtorNo = useMemo(() => {
    const delivery = debtorTrans.find(
      (d: any) => d.reference === stateReference && d.trans_type === 13
    );
    return delivery?.debtor_no ?? null;
  }, [debtorTrans, stateReference]);

  const { summary: creditSummary, isLoading: creditLoading } = useCustomerCredit(
    deliveryDebtorNo,
    customers
  );

  // === Actions ===
  const handleUpdate = async () => {
    const delivery = debtorTrans.find(
      (d: any) => d.reference === stateReference && d.trans_type === 13
    );
    if (!delivery) {
      alert("Delivery not found");
      return;
    }

    try {
      const recordId = delivery.id ?? delivery.trans_no;
      await updateDebtorTran(recordId, {
        tran_date: date,
        due_date: dueDate || date,
        ov_freight: shippingCost,
        ship_via: shippingCompany,
        payment_terms: paymentTerm,
      });
      await queryClient.invalidateQueries({ queryKey: ["debtorTrans"] });
      alert("Invoice header saved against delivery note.");
    } catch (error: any) {
      console.error("Error updating delivery for invoice:", error);
      alert(
        "Failed to save: " +
          (error.response?.data?.message || error.message || "Unknown error")
      );
    }
  };
  const handleProcessInvoice = async () => {
    const delivery = debtorTrans.find((d: any) => d.reference === stateReference && d.trans_type === 13);
    if (!delivery) {
      alert("Delivery not found");
      return;
    }

    const creditError = validateCustomerCreditForSale({
      summary: creditSummary,
      documentTotal: invoiceTotal,
      skipCreditCheck: isCashSalePaymentTerm(paymentTerms, paymentTerm),
    });
    if (creditError) {
      alert(creditError);
      return;
    }

    // Generate new trans_no
    const maxTransNo = debtorTrans.length > 0 ? Math.max(...debtorTrans.map(d => d.trans_no || 0)) : 0;
    const newTransNo = maxTransNo + 1;

    // Generate new reference
    const fiscalYear = selectedFiscalYear ? new Date(selectedFiscalYear.fiscal_year_from).getFullYear() : new Date().getFullYear();
    const invoices = debtorTrans.filter(d => d.trans_type === 10 && d.reference.endsWith(`/${fiscalYear}`));
    const numbers = invoices.map(d => parseInt(d.reference.split('/')[0]) || 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    const newReference = `${nextNum}/${fiscalYear}`;

    const invoiceData = {
      trans_no: newTransNo,
      debtor_no: delivery.debtor_no,
      branch_code: delivery.branch_code,
      reference: newReference,
      trans_type: 10,
      ship_via: delivery.ship_via,
      tpe: delivery.tpe,
      tran_date: date,
      ov_amount: invoiceTotal,
      alloc:invoiceTotal,
      due_date: dueDate || date,
      payment_terms: paymentTerm,
      shipping_company: shippingCompany,
      memo: memo,
      order_no: delivery.order_no,
    };

    try {
      const newTrans = await createTransMutation.mutateAsync(invoiceData);
      const transNo = newTrans.trans_no;
      const filteredRows = rows.filter(r => r.thisInvoice > 0);
      console.log("Filtered rows for details:", filteredRows);
      const detailsPromises = filteredRows.map(r =>
        createDetailMutation.mutateAsync({
          debtor_trans_no: transNo,
          debtor_trans_type: 10,
          stock_id: r.itemCode,
          description: r.description,
          quantity: r.thisInvoice,
          unit_price: r.price,
          unit_tax: r.unitTax,
          discount_percent: r.discount,
          standard_cost: r.standardCost,
          qty_done: r.thisInvoice,
          src_id: r.src_id,
        })
      );
      console.log("Details promises:", detailsPromises.length);
      await Promise.all(detailsPromises);
      queryClient.invalidateQueries({ queryKey: ['debtorTransDetails'] });
      await queryClient.invalidateQueries({
        queryKey: ["customerCreditSummary", delivery.debtor_no],
      });
      alert("Invoice processed successfully!");
      navigate("/sales/transactions/direct-delivery/customer-invoice/success", { state: { transNo: newTransNo, reference: newReference, date } });
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error processing invoice: " + (error.response?.data?.message || error.message));
    }
  };

  const breadcrumbItems = [
    { title: "Transactions", href: "/sales/transactions" },
    { title: "Issue an Invoice for Delivery Note" },
  ];

  return (
    <FormPageLayout>
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <PageTitle title="Issue an Invoice for Delivery Note" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      {/* Form */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Customer" value={customer} size="small" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Branch" value={branch} size="small" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Payment Terms"
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
              size="small"
            >
              {paymentTerms.map((term: any) => (
                <MenuItem key={term.terms_indicator} value={term.terms_indicator}>
                  {term.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Reference" value={reference} size="small" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Sales Type" value={salesType} size="small" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Currency" value={currency} size="small" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <CustomerCreditSummaryFields
              summary={creditSummary}
              documentTotal={invoiceTotal}
              isLoading={creditLoading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Shipping Company"
              value={shippingCompany}
              onChange={(e) => setShippingCompany(e.target.value)}
              size="small"
            >
              {shippingCompanies.map((sc: any) => (
                <MenuItem key={sc.shipper_id} value={sc.shipper_id}>
                  {sc.shipper_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="Date"
              fullWidth
              size="small"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: selectedFiscalYear ? new Date(selectedFiscalYear.fiscal_year_from).toISOString().split('T')[0] : undefined,
                max: selectedFiscalYear ? new Date(selectedFiscalYear.fiscal_year_to).toISOString().split('T')[0] : undefined,
              }}
              error={!!dateError}
              helperText={dateError}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="Due Date"
              fullWidth
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
      {/* Items Table */}
      <Typography variant="subtitle1" sx={{ mb: 2, textAlign: "center" }}>
        Invoice Items
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Item Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Delivered</TableCell>
              <TableCell>Units</TableCell>
              <TableCell>Invoiced</TableCell>
              <TableCell>This Invoice</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Tax Type</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.itemCode}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.delivered}</TableCell>
                <TableCell>{row.units}</TableCell>
                <TableCell>{row.invoiced}</TableCell>
                <TableCell>
                  <FormattedNumberField
                    size="small"
                    value={row.thisInvoice}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, thisInvoice: value, total: value * r.price } : r
                        )
                      );
                    }}
                  />
                </TableCell>
                <TableCell>{row.price}</TableCell>
                <TableCell>{row.taxType}</TableCell>
                <TableCell>{row.discount}%</TableCell>
                <TableCell>{row.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={10}>Shipping Cost</TableCell>
              <TableCell>
                <FormattedNumberField
                  size="small"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={10} sx={{ fontWeight: 600 }}>
                Sub Total
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{subTotal.toFixed(2)}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={10} sx={{ fontWeight: 600 }}>
                Invoice Total
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{invoiceTotal.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {/* Memo and Actions */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <TextField
          fullWidth
          label="Memo"
          multiline
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleUpdate} disabled={!!dateError}>
            Update
          </Button>
          <Button variant="contained" color="success" onClick={handleProcessInvoice} disabled={!!dateError}>
            Process Invoice
          </Button>
        </Box>
      </Paper>
    </FormPageLayout>
  );
}
