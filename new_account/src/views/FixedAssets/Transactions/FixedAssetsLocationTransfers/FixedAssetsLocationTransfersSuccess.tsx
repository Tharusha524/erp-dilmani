import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import CloseIcon from '@mui/icons-material/Close';

export default function FixedAssetsLocationTransfersSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference, date, fromLocation, toLocation } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Fixed Assets Location Transfers" },
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
          <PageTitle title="Fixed Assets transfer has been processed." />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/itemsandinventory/transactions")}
        >
          Close
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 2 }}>
          Your inventory transfer has been processed successfully.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/fixedassets/transactions/fixed-assets-location-transfer/view", { state })}
          >
            1. View this transfer
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/fixedassets/transactions/fixed-assets-location-transfer")}
          >
            2. Enter Another Fixed Assets Transfer
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
