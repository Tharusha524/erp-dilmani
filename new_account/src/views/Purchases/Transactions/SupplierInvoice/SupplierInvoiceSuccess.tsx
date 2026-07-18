import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";

export default function SupplierInvoiceSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Enter Supplier Invoice" },
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
          <PageTitle title="Enter Supplier Invoice" />
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
          Supplier invoice has been processed.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/supplier-invoice/view-supplier-invoice", { state })}
          >
            View this Invoice
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => {
              navigate(
                purchasesGlJournalPath({
                  reference: state?.reference ?? reference,
                  date: (state?.date ?? state?.invoiceDate) as string | undefined,
                  trans_type: (state?.trans_type ?? 20) as number,
                  trans_no: state?.trans_no as number | string | undefined,
                  orderNo: state?.orderNo as number | string | undefined,
                }),
                {
                  state: {
                    reference: state?.reference ?? reference,
                    date: state?.date ?? state?.invoiceDate,
                    trans_type: state?.trans_type ?? 20,
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
            onClick={() => navigate("/purchase/transactions/payment-to-suppliers")}
          >
           Entry supplier payment for this invoice
          </Button>

          {state?.returnToAllocation?.transNo ? (
            <Button
              variant="contained"
              sx={{ width: '500px' }}
              onClick={() =>
                navigate(
                  "/purchase/transactions/allocate-supplier-payments-credit-notes/view-supplier-allocations",
                  { state: state.returnToAllocation }
                )
              }
            >
              Return to allocate payment
            </Button>
          ) : null}

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/supplier-invoice", { state })}
          >
           Enter Another Invoice
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
    </FormPageLayout>
  );
}
