import React from "react";
import { Box, Typography } from "@mui/material";
import WorkOrderAnalytics from "./WorkOrderAnalytics";
import WorkOrderListTable from "./WorkOrderListTable";

export default function WorkOrderDashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Work Order Dashboard
      </Typography>
      <WorkOrderAnalytics />
      <WorkOrderListTable />
    </Box>
  );
}
