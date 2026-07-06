import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function AddInventoryAdjustmentsSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Inventory Adjustments" },
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
          <PageTitle title="Items adjustment has been processed." />
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
          Your inventory adjustment has been processed successfully.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/itemsandinventory/transactions/inventory-adjustments/view", { state })}
          >
            1. View this adjustment
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/itemsandinventory/transactions/gl-journal-entries", {
                state: { reference, trans_type: 17, trans_no: state?.trans_no },
              })
            }
          >
            2. View the GL Postings for this adjustment
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/itemsandinventory/transactions/inventory-adjustments")}
          >
            3. Enter another adjustment
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/setup/maintenance/attach-documents", { state })}
          >
            4. Add an attachment
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
