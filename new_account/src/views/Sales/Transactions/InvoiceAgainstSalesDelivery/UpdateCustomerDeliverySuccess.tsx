import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function UpdateCustomerDeliverySuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { deliveryNo, reference, date } = state || {};

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: `Modifying Delivery Note #${deliveryNo || ""}` },
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
                    <PageTitle title={`Modifying Delivery Note #${deliveryNo || ""}`} />
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
                <Typography sx={{ mb: 2 }}>
                    Delivery Note # {deliveryNo || ""} has been updated.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-delivery/view-direct-delivery", { state })}
                    >
                        View This Delivery
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/direct-delivery/view-direct-delivery", {
                                state: { ...state, printMode: "delivery" },
                            })
                        }
                    >
                        Print Delivery Note
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                    >
                        Email Delivery Note
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/", { state })}
                    >
                        Print as Packing Slip
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/work-order-entry", { state })}
                    >
                        Email as Packing Slip
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-delivery/customer-invoice", { state })}
                    >
                        Confirm Delivery and Invoice
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/invoice-against-sales-delivery", { state })}
                    >
                        Select A Different Delivery
                    </Button>
                  
                </Stack>
            </Paper>
        </Stack>
    );
}
