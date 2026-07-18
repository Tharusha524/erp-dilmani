import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";

export default function DirectInvoiceSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { location: loc, reference, date } = state || {};

    const { data: debtorTrans } = useQuery({
        queryKey: ['debtorTrans'],
        queryFn: getDebtorTrans,
    });

    const currentTrans = debtorTrans?.find((trans: any) => trans.trans_type === 10 && trans.reference === reference);
    const trans_no = currentTrans?.trans_no;

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
