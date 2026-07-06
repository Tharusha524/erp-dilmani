import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function UpdateSalesOrderEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { orderNo, reference, orderDate } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Modifying Sales Order" },
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
          <PageTitle title="Modifying Sales Order" />
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
          Order # {orderNo} has been updated.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/sales-order-entry/view-sales-order", { state })}
          >
            View This Order
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() =>
              navigate("/sales/transactions/sales-order-entry/view-sales-order", {
                state: { ...state, autoPrint: true },
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
            Confirm Order Quantities and Make Delivery
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '300px' }}
            onClick={() => navigate("/sales/transactions/delivery-against-sales-orders", { state })}
          >
            Select A Different Order
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
