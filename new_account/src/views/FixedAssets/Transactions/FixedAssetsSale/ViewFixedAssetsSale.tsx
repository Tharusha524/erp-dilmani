import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useMemo } from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Stack,
    Button,
    Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getBranches } from "../../../../api/CustomerBranch/CustomerBranchApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import { bankAccountLabel } from "../../../../utils/cashBankAccount";

export default function ViewFixedAssetsSale() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const {
        customer,
        branch_code,
        reference,
        deliveryReference,
        invoiceDate,
        loc_code,
        items = [],
        subtotal,
        totalInvoice,
        trans_no,
        trans_type,
        delivery_trans_no,
        delivery_trans_type,
        comments,
        cashAccount,
        isCashSale,
    } = state || {};

    const { data: customers = [] } = useQuery({
        queryKey: ["customers"],
        queryFn: getCustomers,
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: () => getBranches(),
    });

    const { data: bankAccounts = [] } = useQuery({
        queryKey: ["bankAccounts"],
        queryFn: getBankAccounts,
    });

    const customerName = useMemo(() => {
        if (!customer) return "-";
        const found = (customers || []).find(
            (c: { debtor_no?: number | string; name?: string }) =>
                String(c.debtor_no) === String(customer)
        );
        return found?.name ?? customer;
    }, [customers, customer]);

    const branchName = useMemo(() => {
        if (!branch_code) return "-";
        const found = (branches || []).find(
            (b: { branch_code?: number | string; br_name?: string }) =>
                String(b.branch_code) === String(branch_code)
        );
        return found?.br_name ?? branch_code;
    }, [branches, branch_code]);

    const cashAccountLabel = useMemo(() => {
        if (!cashAccount) return isCashSale ? "-" : "Credit sale";
        const found = (bankAccounts || []).find(
            (acc: { id?: number | string }) => String(acc.id) === String(cashAccount)
        );
        return found ? bankAccountLabel(found) : cashAccount;
    }, [bankAccounts, cashAccount, isCashSale]);

    const breadcrumbItems = [
        { title: "Fixed Assets", href: "/fixedassets/transactions" },
        { title: "Fixed Assets Sale" },
    ];

    return (
        <FormPageLayout>
            <Box
                sx={{
                    padding: 2,
                    boxShadow: 2,
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Box>
                    <PageTitle title={`Fixed Assets Sale — ${reference || "-"}`} />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>
            </Box>
            <Paper sx={{ p: 3 }}>
                <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "var(--pallet-dark-blue)" }}
                >
                    FIXED ASSET SALES INVOICE # {reference || "-"}
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Customer:</b> {customerName}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Branch:</b> {branchName}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Invoice Reference:</b> {reference || "-"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Delivery Reference:</b> {deliveryReference || "-"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Deliver From:</b> {loc_code || "-"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Invoice Date:</b> {invoiceDate || "-"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography>
                            <b>Cash Account:</b> {cashAccountLabel}
                        </Typography>
                    </Grid>
                    {trans_no ? (
                        <Grid item xs={12} sm={6}>
                            <Typography>
                                <b>Sales Invoice:</b> type {trans_type ?? 10} / #{trans_no}
                            </Typography>
                        </Grid>
                    ) : null}
                    {delivery_trans_no ? (
                        <Grid item xs={12} sm={6}>
                            <Typography>
                                <b>Delivery:</b> type {delivery_trans_type ?? 13} / #
                                {delivery_trans_no}
                            </Typography>
                        </Grid>
                    ) : null}
                    {comments ? (
                        <Grid item xs={12}>
                            <Typography>
                                <b>Comments:</b> {comments}
                            </Typography>
                        </Grid>
                    ) : null}
                </Grid>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography sx={{ mb: 1, fontWeight: 600 }}>
                    Fixed Asset Items on this Invoice
                </Typography>

                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Discount %</TableCell>
                                <TableCell align="right">Line Value</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>No items available</TableCell>
                                </TableRow>
                            ) : (
                                items.map(
                                    (
                                        row: {
                                            item?: string;
                                            description?: string;
                                            unit?: string;
                                            quantity?: number;
                                            price?: number;
                                            discount?: number;
                                            lineValue?: number;
                                        },
                                        idx: number
                                    ) => (
                                        <TableRow key={idx}>
                                            <TableCell>{row.item ?? "-"}</TableCell>
                                            <TableCell>{row.description ?? "-"}</TableCell>
                                            <TableCell>{row.unit ?? "-"}</TableCell>
                                            <TableCell align="right">
                                                {row.quantity ?? "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.price != null
                                                    ? Number(row.price).toFixed(2)
                                                    : "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.discount ?? 0}
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.lineValue != null
                                                    ? Number(row.lineValue).toFixed(2)
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    )
                                )
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                    <Box sx={{ width: 260 }}>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography>Subtotal:</Typography>
                            <Typography>
                                {subtotal != null ? Number(subtotal).toFixed(2) : "-"}
                            </Typography>
                        </Stack>

                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            sx={{ fontWeight: 600 }}
                        >
                            <Typography sx={{ fontWeight: 600 }}>Total Invoice:</Typography>
                            <Typography sx={{ fontWeight: 600 }}>
                                {totalInvoice != null
                                    ? Number(totalInvoice).toFixed(2)
                                    : "-"}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                    <Button
                        variant="outlined"
                        onClick={() =>
                            navigate("/fixedassets/transactions/gl-journal-entries", {
                                state: {
                                    reference,
                                    date: invoiceDate,
                                    trans_type: trans_type ?? 10,
                                    trans_no,
                                },
                            })
                        }
                    >
                        View Invoice GL
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() =>
                            navigate("/fixedassets/transactions/gl-journal-entries", {
                                state: {
                                    reference: deliveryReference ?? reference,
                                    date: invoiceDate,
                                    trans_type: delivery_trans_type ?? 13,
                                    trans_no: delivery_trans_no,
                                },
                            })
                        }
                    >
                        View Delivery GL
                    </Button>
                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Close
                    </Button>
                </Stack>
            </Paper>
        </FormPageLayout>
    );
}
