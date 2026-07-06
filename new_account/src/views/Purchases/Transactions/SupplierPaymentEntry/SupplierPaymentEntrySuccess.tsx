import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";

export default function SupplierPaymentEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Supplier Payment Entry" },
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
          <PageTitle title="Supplier Payment Entry" />
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
          Payment has been successfully entered
          {state?.trans_no != null ? ` (payment #${state.trans_no})` : ""}
          {state?.reference ? ` — reference ${state.reference}` : ""}
          .
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/payment-to-suppliers/view-supplier-payment", {
                state: { ...state, autoPrint: true },
              })
            }
          >
            Print This Remittance
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => {
              // Navigate to GL postings view - pass reference so GL view can filter
              window.location.href = `mailto:?subject=${encodeURIComponent(`Supplier remittance ${reference ?? ""}`)}`;
            }}
          >
            Email This Remittance
          </Button>
           <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/payment-to-suppliers/view-supplier-payment", { state })}
          >
            View this Payment
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate(
                purchasesGlJournalPath({
                  reference: state?.reference ?? reference,
                  date: (state?.datePaid ?? state?.date ?? date) as string | undefined,
                  trans_type: 22,
                  trans_no: state?.trans_no as number | string | undefined,
                }),
                {
                  state: {
                    reference: state?.reference ?? reference,
                    date: state?.datePaid ?? state?.date ?? date,
                    trans_type: 22,
                    trans_no: state?.trans_no,
                    allocations: state?.allocations,
                    amount: state?.amount,
                  },
                }
              )
            }
          >
            View the GL Journal Entries for this Payment
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/payment-to-suppliers", {
                state: state?.supplier
                  ? { supplier: state.supplier, supplierId: state.supplier }
                  : undefined,
              })
            }
          >
            Enter another supplier payment
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/supplier-invoice", {
              state: state?.supplier ? { supplier: state.supplier } : undefined,
            })}
          >
            Enter Supplier Invoice
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/direct-supplier-invoice", {
              state: state?.supplier ? { supplier: state.supplier } : undefined,
            })}
          >
            Enter direct Invoice
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/bankingandgeneralledger/transactions/payments")}
          >
            Enter Other Payment
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/sales/transactions/customer-payments")}
          >
            Enter Customer Payment
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/bankingandgeneralledger/transactions/deposits")}
          >
            Enter Other Deposit
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/bankingandgeneralledger/transactions/bank-account-transfers", { state })}
          >
            Bank Account Transfer
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
