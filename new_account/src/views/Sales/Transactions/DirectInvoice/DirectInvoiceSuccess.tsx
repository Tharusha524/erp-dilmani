import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function DirectInvoiceSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { location: loc, reference, date, trans_no } = state || {};
    // The invoice's own id — always resolves to the correct invoice, unlike
    // matching by reference (which isn't guaranteed unique).
    const viewPath = trans_no
        ? `/sales/transactions/direct-invoice/view-direct-invoice/${trans_no}`
        : "/sales/transactions/direct-invoice/view-direct-invoice";

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Direct Sales Invoice" },
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
                    <PageTitle title="Direct Sales Invoice" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => navigate("/sales/transactions")}
                >
                    Close
                </Button>
            </Box>
            <Paper sx={{ p: 2 }}>
                <Typography sx={{ mb: 2, textAlign: 'center' }}>
                    Invoice # {trans_no} has been entered.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate(viewPath, { state })}
                    >
                        View This Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate(viewPath, {
                                state: { ...state, autoPrint: true },
                            })
                        }
                    >
                        Print Sales Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                    >
                        Email Sales Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-invoice/print-receipt", { state })}
                    >
                        Print Receipt
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/gl-journal-entries", { state })}
                    >
                        View the GL Journal Entries for this Invoice
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-invoice", { state })}
                    >
                        Enter a New Direct Invoice
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/setup/maintenance/attach-documents")}
                    >
                        Add an Attachment
                    </Button>
                </Stack>
            </Paper>
        </FormPageLayout>
    );
}
