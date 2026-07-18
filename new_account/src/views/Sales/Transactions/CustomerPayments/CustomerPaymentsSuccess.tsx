import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { customerPaymentGlNavState } from "../../../../utils/salesGlJournalNavState";

export default function CustomerPaymentsSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const glState = customerPaymentGlNavState(state as Record<string, unknown>);

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Customer Payment Entry" },
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
                    <PageTitle title="Customer Payment Entry" />
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
                   The customer payment has been successfully entered.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => {
                            const transNo = state?.trans_no ?? state?.transNo;
                            const path = transNo
                                ? `/sales/transactions/customer-payments/view-customer-payment?trans_no=${transNo}`
                                : "/sales/transactions/customer-payments/view-customer-payment";
                            navigate(path, { state: { ...state, ...glState } });
                        }}
                    >
                      View this Customer Payment
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => {
                            const transNo = state?.trans_no ?? state?.transNo;
                            const path = transNo
                                ? `/sales/transactions/customer-payments/view-customer-payment?trans_no=${transNo}`
                                : "/sales/transactions/customer-payments/view-customer-payment";
                            navigate(path, { state: { ...state, ...glState, autoPrint: true } });
                        }}
                    >
                        Print This Receipt
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                    >
                        Email This Receipt
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/gl-journal-entries", { state: glState })}
                    >
                        View the GL Journal Entries for this Customer Payment
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/customer-payments", { state })}
                    >
                        Enter Another Customer Payment
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/bankingandgeneralledger/transactions/deposits")}
                    >
                        Enter Other Deposit
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/purchase/transactions/payment-to-suppliers")}
                    >
                        Enter Payment to Supplier
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/bankingandgeneralledger/transactions/payments")}
                    >
                        Enter Other Payment
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/bankingandgeneralledger/transactions/bank-account-transfers", { state })}
                    >
                        Bank Account Transfer
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
