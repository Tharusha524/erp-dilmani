import React from "react";
import { Box, Typography } from "@mui/material";
import WorkOrderListTable from "./WorkOrderListTable";

export default function WorkOrderDashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700}>
        Work Order Dashboard
      </Typography>
      <WorkOrderListTable />
    </Box>
  );
}
