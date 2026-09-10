import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Stack,
    Typography,
    TextField,
    Button,
    MenuItem,
    Paper,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getCustomerTransactionInquiry } from "../../../../api/SalesInquiry/SalesInquiryApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";

interface Customer {
    debtor_no: number;
    name: string;
}

interface InvoiceOption {
    trans_no: number;
    reference: string;
    customer_name: string;
    tran_date?: string;
}

interface PrintInvoicesFormData {
    from: string;
    to: string;
    currencyFilter: string;
    email: string;
    paymentLink: string;
    customer: string;
    comments: string;
    orientation: string;
}

// Sales invoice transactions in debtor_trans use trans_type 10.
const SALES_INVOICE_TRANS_TYPE = 10;

export default function PrintInvoicesForm() {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    const [formData, setFormData] = useState<PrintInvoicesFormData>({
        from: "",
        to: "",
        currencyFilter: "NoFilter",
        email: "No",
        paymentLink: "noPaymentLink",
        customer: "NoFilter",
        comments: "",
        orientation: "Portrait",
    });

    const [errors, setErrors] = useState<Partial<PrintInvoicesFormData>>({});
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersData, currenciesData, invoiceRows] = await Promise.all([
                    getCustomers(),
                    getCurrencies(),
                    getCustomerTransactionInquiry({
                        trans_type: SALES_INVOICE_TRANS_TYPE,
                        limit: 500,
                    }),
                ]);

                setCustomers(customersData);
                setCurrencies(currenciesData);

                const mapped: InvoiceOption[] = (Array.isArray(invoiceRows) ? invoiceRows : [])
                    .filter(
                        (row: Record<string, unknown>) =>
                            Number(row.trans_type) === SALES_INVOICE_TRANS_TYPE
                    )
                    .map((row: Record<string, unknown>) => ({
                        trans_no: Number(row.trans_no),
                        reference: String(row.reference ?? row.trans_no ?? ""),
                        customer_name: String(row.customer_name ?? ""),
                        tran_date: row.tran_date ? String(row.tran_date) : undefined,
                    }))
                    // Ascending by transaction number so "From" -> "To" reads as a range.
                    .sort((a, b) => a.trans_no - b.trans_no);

                setInvoices(mapped);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const invoiceLabel = (inv: InvoiceOption) =>
        inv.customer_name
            ? `SI ${inv.reference} ${inv.customer_name}`
            : `SI ${inv.reference}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validate = () => {
        const newErrors: Partial<PrintInvoicesFormData> = {};

        if (
            formData.from &&
            formData.to &&
            Number(formData.from) > Number(formData.to)
        ) {
            newErrors.to = '"To" invoice must not be before "From" invoice';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const runReportPdf = useReportGenerate({ validate });
    const handleGenerate = () => {
        void runReportPdf(formData);
    };

    // "To" list only shows invoices at or after the chosen "From".
    const toOptions = useMemo(() => {
        if (!formData.from) return invoices;
        const fromNo = Number(formData.from);
        return invoices.filter((inv) => inv.trans_no >= fromNo);
    }, [invoices, formData.from]);

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <FormPageLayout>
            <Paper
                sx={{
                    p: 3,
                    maxWidth: "650px",
                    width: "100%",
                    boxShadow: 2,
                    borderRadius: 2,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}
                >
                    Print Invoices
                </Typography>

                <Stack spacing={2}>
                    {/* From invoice */}
                    <TextField
                        label="From"
                        name="from"
                        size="small"
                        fullWidth
                        select
                        value={formData.from}
                        onChange={handleChange}
                    >
                        <MenuItem value="">Earliest invoice</MenuItem>
                        {invoices.map((inv) => (
                            <MenuItem key={inv.trans_no} value={inv.trans_no.toString()}>
                                {invoiceLabel(inv)}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* To invoice */}
                    <TextField
                        label="To"
                        name="to"
                        size="small"
                        fullWidth
                        select
                        value={formData.to}
                        onChange={handleChange}
                        error={!!errors.to}
                        helperText={errors.to}
                    >
                        <MenuItem value="">Latest invoice</MenuItem>
                        {toOptions.map((inv) => (
                            <MenuItem key={inv.trans_no} value={inv.trans_no.toString()}>
                                {invoiceLabel(inv)}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Currency Filter */}
                    <TextField
                        label="Currency Filter"
                        name="currencyFilter"
                        size="small"
                        fullWidth
                        select
                        value={formData.currencyFilter}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No currency filter</MenuItem>
                        {currencies.map((currency) => (
                            <MenuItem
                                key={currency.id}
                                value={currency.currency_abbreviation}
                            >
                                {currency.currency_abbreviation} - {currency.currency_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Email Customers */}
                    <TextField
                        label="Email Customers"
                        name="email"
                        size="small"
                        fullWidth
                        select
                        value={formData.email}
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </TextField>

                    {/* Payment Link */}
                    <TextField
                        label="Payment Link"
                        name="paymentLink"
                        size="small"
                        fullWidth
                        select
                        value={formData.paymentLink}
                        onChange={handleChange}
                    >
                        <MenuItem value="noPaymentLink">No Payment Link</MenuItem>
                    </TextField>

                    {/* Customer filter */}
                    <TextField
                        label="Customer"
                        name="customer"
                        size="small"
                        fullWidth
                        select
                        value={formData.customer}
                        onChange={handleChange}
                    >
                        <MenuItem value="NoFilter">No customer filter</MenuItem>
                        {customers.map((customer) => (
                            <MenuItem
                                key={customer.debtor_no}
                                value={customer.debtor_no.toString()}
                            >
                                {customer.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Comments */}
                    <TextField
                        label="Comments"
                        name="comments"
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        value={formData.comments}
                        onChange={handleChange}
                    />

                    {/* Orientation */}
                    <TextField
                        label="Orientation"
                        name="orientation"
                        size="small"
                        fullWidth
                        select
                        value={formData.orientation}
                        onChange={handleChange}
                    >
                        <MenuItem value="Portrait">Portrait</MenuItem>
                        <MenuItem value="Landscape">Landscape</MenuItem>
                    </TextField>
                </Stack>

                {/* Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 3,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 2 : 0,
                    }}
                >
                    <Button onClick={() => window.history.back()}>Back</Button>

                    <Button
                        variant="contained"
                        fullWidth={isMobile}
                        sx={{ backgroundColor: "var(--pallet-blue)" }}
                        onClick={handleGenerate}
                    >
                        Generate
                    </Button>
                </Box>
            </Paper>
        </FormPageLayout>
    );
}
