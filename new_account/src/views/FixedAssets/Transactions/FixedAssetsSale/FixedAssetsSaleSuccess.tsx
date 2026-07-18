import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function FixedAssetsSaleSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { reference, invoiceDate, trans_no, trans_type } = state || {};

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
                    <PageTitle title="Fixed Assets Sale" />
                    <Breadcrumb breadcrumbs={breadcrumbItems} />
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => navigate("/fixedassets/transactions")}
                >
                    Close
                </Button>
            </Box>
            <Paper sx={{ p: 2 }}>
                <Typography sx={{ mb: 2 }}>
                    Fixed asset sales invoice has been entered
                    {reference ? ` (${reference})` : ""}
                    {trans_no ? ` — Invoice #${trans_no}` : ""}.
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() =>
                            navigate(
                                "/fixedassets/transactions/fixed-assets-sale/view-fixed-assets-sale",
                                { state }
                            )
                        }
                    >
                        View this Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() =>
                            navigate("/fixedassets/transactions/gl-journal-entries", {
                                state: {
                                    reference: state?.reference ?? reference,
                                    date: state?.date ?? state?.invoiceDate ?? invoiceDate,
                                    trans_type: state?.trans_type ?? trans_type ?? 10,
                                    trans_no: state?.trans_no ?? trans_no,
                                },
                            })
                        }
                    >
                        View GL Journal Entries (Sales Invoice)
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() =>
                            navigate("/fixedassets/transactions/gl-journal-entries", {
                                state: {
                                    reference: state?.deliveryReference ?? state?.reference,
                                    date: state?.date ?? state?.invoiceDate ?? invoiceDate,
                                    trans_type: state?.delivery_trans_type ?? 13,
                                    trans_no: state?.delivery_trans_no,
                                },
                            })
                        }
                    >
                        View GL Journal Entries (Delivery)
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() =>
                            navigate("/sales/transactions/customer-payments", { state })
                        }
                    >
                        Enter Customer Payment for this Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() =>
                            navigate("/fixedassets/transactions/fixed-assets-sale")
                        }
                    >
                        Enter Another Fixed Asset Sale
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: "500px" }}
                        onClick={() => navigate("/setup/maintenance/attach-documents")}
                    >
                        Add an Attachment
                    </Button>
                </Stack>
            </Paper>
        </FormPageLayout>
    );
}
