import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function InternalServiceInvoiceSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id, reference } = state || {};

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Internal Service Invoice" },
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
                    <PageTitle title="Internal Service Invoice" />
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
                    Invoice {reference ? `#${reference}` : `#${id}`} has been entered.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
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
                        onClick={() => navigate("/sales/transactions/internal-service-invoice", { state })}
                    >
                        Enter a New Internal Service Invoice
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
