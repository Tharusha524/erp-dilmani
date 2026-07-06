import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { deliveryGlNavState } from "../../../../utils/salesGlJournalNavState";

export default function CustomerDeliverySuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { transNo, reference, date } = state || {};

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Deliver Items for a Sales Order" },
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
                    <PageTitle title="Deliver Items for a Sales Order" />
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
                    Delivery #{transNo} has been entered.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/customer-delivery/view", { state })}
                    >
                        View This Delivery
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/customer-delivery/view", {
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
                        onClick={() =>
                            navigate("/sales/transactions/customer-delivery/view", {
                                state: { ...state, printMode: "packing" },
                            })
                        }
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
                        onClick={() =>
                          navigate("/sales/transactions/gl-journal-entries", {
                            state: deliveryGlNavState(state as Record<string, unknown>),
                          })
                        }
                    >
                        View the GL Journal Entries for this Dispatch
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-delivery/customer-invoice", { state })}
                    >
                        Invoice This Delivery
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/delivery-against-sales-orders", { state })}
                    >
                        Select Another Order For Dispatch
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
        </Stack>
    );
}
