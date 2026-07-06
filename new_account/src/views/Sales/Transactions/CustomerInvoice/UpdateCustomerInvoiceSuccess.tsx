import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function UpdateCustomerInvoiceSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { trans_no, reference, date } = state || {};

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Customer Sales Invoice" },
    ];

    return (
        <Stack spacing={2}>
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
                    <PageTitle title="Customer Sales Invoice" />
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
                    Invoice # {trans_no} has been updated.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-invoice/view-direct-invoice", { state })}
                    >
                        View This Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/direct-invoice/view-direct-invoice", {
                                state: { ...state, autoPrint: true },
                            })
                        }
                    >
                        Print This Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                    >
                        Email This Invoice
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/inquiriesandreports/customer-transaction-inquiry/", { state })}
                    >
                       Select Another Invoice to Modify
                    </Button>
                    
                </Stack>
            </Paper>
        </Stack>
    );
}
