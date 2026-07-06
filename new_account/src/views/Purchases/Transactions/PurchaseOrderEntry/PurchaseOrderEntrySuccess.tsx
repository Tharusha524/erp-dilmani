import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function PurchaseOrderEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Purchase Order Entry" },
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
          <PageTitle title="Purchase Order Entry" />
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
          Purchase Order has been entered
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/purchase-order-entry/view-purchase-order", { state })}
          >
            View This Order
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/purchase-order-entry/view-purchase-order", {
                state: { ...state, autoPrint: true },
              })
            }
          >
            Print This Order

          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
          >
            Email This Order
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/receive-purchase-order-items", {
                state: {
                  ...state,
                  id: state?.orderNo ?? state?.order_no ?? state?.id,
                },
              })
            }
          >
           Receive Items on this Purchase Order
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/purchase-order-entry", { state })}
          >
           Enter Another Purchase Order
          </Button>
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/outstanding-purchase-orders-maintenance", { state })}
          >
            Select An Outstanding Purchase Order
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
