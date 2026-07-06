import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { creditNoteGlNavState } from "../../../../utils/salesGlJournalNavState";

export default function UpdatedCustomerCreditNotesSuccess() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const glState = creditNoteGlNavState(state as Record<string, unknown>);
    const creditTransNo = glState.trans_no;

    const breadcrumbItems = [
        { title: "Home", href: "/dashboard" },
        { title: "Customer Credit Note" },
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
                    <PageTitle title="Customer Credit Note" />
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
                    Credit Note # {creditTransNo} has been processed
                </Typography>

                <Stack spacing={3} direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/customer-credit-notes/view-updated-customer-credit-note", { state: { ...(state as object), ...glState } })}
                    >
                      View this credit note
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() =>
                            navigate("/sales/transactions/customer-credit-notes/view-updated-customer-credit-note", {
                                state: { ...(state as object), ...glState, autoPrint: true },
                            })
                        }
                    >
                        Print This Credit Invoice
                    </Button>

                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                    >
                        Email This Credit Invoice
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/gl-journal-entries", { state: glState })}
                    >
                        View the GL Journal Entries for this Credit Note
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ width: '300px' }}
                        onClick={() => navigate("/sales/transactions/customer-credit-notes", { state })}
                    >
                        Enter Another Customer Credit Note
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
