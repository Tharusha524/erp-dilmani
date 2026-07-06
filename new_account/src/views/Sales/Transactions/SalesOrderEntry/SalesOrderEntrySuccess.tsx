import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function SalesOrderEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date, orderNo } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "New Sales Order Entry" },
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
          <PageTitle title="New Sales Order Entry" />
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
        Order #{orderNo || reference || ''} has been entered.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-order-entry/view-sales-order", { state: { orderNo: orderNo || reference } })}
          >
            View This Order
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() =>
              navigate("/sales/transactions/sales-order-entry/view-sales-order", {
                state: { orderNo: orderNo || reference, autoPrint: true },
              })
            }
          >
            Print This Order

          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
          >
            Email This Order
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/customer-delivery", { state })}
          >
           Make Delivery Against This Order
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/manufacturing/transactions/work-order-entry", { state })}
          >
           Work Order Entry
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-order-entry", { state })}
          >
           Enter a New Order
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
