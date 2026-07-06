import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function SalesQuotationEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date, orderNo } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "New Sales Quotation Entry" },
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
          <PageTitle title="New Sales Quotation Entry" />
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
          Quotation #{orderNo || ''} has been entered.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-quotation-entry/view-sales-quotation", { state })}
          >
            View This Quotation
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() =>
              navigate("/sales/transactions/sales-quotation-entry/view-sales-quotation", {
                state: { ...state, autoPrint: true },
              })
            }
          >
            Print This Quotation

          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
          >
            Email This Quotation
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-order-entry", { state })}
          >
           Make Sales Order Against This Quotation
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-quotation-entry", { state })}
          >
           Enter a New Quotation
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
