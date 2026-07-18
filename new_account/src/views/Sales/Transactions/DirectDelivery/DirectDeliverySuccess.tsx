import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";

export default function DirectDeliverySuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { location: loc, reference, date, trans_no } = state || {};

    const { data: debtorTrans } = useQuery({
        queryKey: ['debtorTrans'],
        queryFn: getDebtorTrans,
    });

    const currentTrans = debtorTrans?.find((trans: any) => trans.trans_type === 13 && String(trans.trans_no) === String(trans_no));
    const displayTransNo = currentTrans?.trans_no || trans_no;

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Direct Sales Delivery" },
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
                    <PageTitle title="Direct Sales Delivery" />
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
                    Delivery # {displayTransNo} has been entered.
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
                        onClick={() => (window.location.href = `mailto:?subject=Delivery%20${encodeURIComponent(reference || "")}`)}
                    >
                        Email Delivery Note
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/direct-delivery/view-direct-delivery", {
                                state: { ...state, printMode: "packing" },
                            })
                        }
                    >
                        Print as Packing Slip
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/direct-delivery/view-direct-delivery", {
                                state: { ...state, printMode: "packing" },
                            })
                        }
                    >
                        Email as Packing Slip
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/gl-journal-entries", {
                                state: {
                                    ...state,
                                    reference: state?.reference ?? reference,
                                    date: state?.deliveryDate ?? state?.date ?? date,
                                    trans_type: 13,
                                    trans_no: state?.trans_no ?? trans_no,
                                },
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
                        Make Invoice Against This Delivery
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/direct-delivery", { state })}
                    >
                        Enter a New Delivery
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
