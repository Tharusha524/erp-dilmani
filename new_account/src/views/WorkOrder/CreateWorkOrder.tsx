import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router";
import WorkOrderListTable from "./WorkOrderListTable";

export default function CreateWorkOrder() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h5" fontWeight={700}>
          Create Work Order
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/workorder/create/add-work-order")}
        >
          Add Work Order
        </Button>
      </Stack>
      <WorkOrderListTable />
    </Box>
  );
}
