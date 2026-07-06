import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";

export default function SupplierCreditNoteSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Supplier Credit Note" },
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
          <PageTitle title="Supplier Credit Note" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/purchase/transactions")}
        >
          Close
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 2 }}>
          Supplier credit note has been processed.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/supplier-credit-notes/view-supplier-credit-note", { state })}
          >
            View this Credit Note
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/supplier-credit-notes/view-supplier-credit-note", {
                state: { ...state, autoPrint: true },
              })
            }
          >
            Print This Credit Note
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => {
              navigate(
                purchasesGlJournalPath({
                  reference: state?.reference ?? reference,
                  date: (state?.date ?? state?.creditNoteDate) as string | undefined,
                  trans_type: (state?.trans_type ?? 21) as number,
                  trans_no: state?.trans_no as number | string | undefined,
                }),
                {
                  state: {
                    reference: state?.reference ?? reference,
                    date: state?.date ?? state?.creditNoteDate,
                    trans_type: state?.trans_type ?? 21,
                    trans_no: state?.trans_no,
                  },
                }
              );
            }}
          >
           View the GL Journal Entries for this Invoice
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/supplier-credit-notes")}
          >
           Enter Another Credit Note
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/setup/maintenance/attach-documents")}
          >
           Add an Attachment
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
