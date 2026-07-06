import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function FixedAssetsPurchaseSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Fixed Assets", href: "/fixedassets/transactions" },
    { title: "Fixed Asset Purchase" },
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
          <PageTitle title="Fixed Asset Purchase" />
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
          Fixed asset purchase invoice has been entered
          {reference ? ` (${reference})` : ""}.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: "500px" }}
            onClick={() =>
              navigate("/fixedassets/transactions/fixed-assets-purchase/view-fixed-assets-purchase", {
                state,
              })
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
                  date: state?.date ?? state?.invoiceDate ?? date,
                  trans_type: state?.trans_type ?? 20,
                  trans_no: state?.trans_no,
                },
              })
            }
          >
            View the GL Journal Entries for this Invoice
          </Button>

          <Button
            variant="outlined"
            sx={{ width: "500px" }}
            onClick={() =>
              navigate("/purchase/transactions/payment-to-suppliers", { state })
            }
          >
            Enter supplier payment for this invoice
          </Button>

          <Button
            variant="outlined"
            sx={{ width: "500px" }}
            onClick={() =>
              navigate("/fixedassets/transactions/fixed-assets-purchase")
            }
          >
            Enter Another Fixed Asset Purchase
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
    </Stack>
  );
}
