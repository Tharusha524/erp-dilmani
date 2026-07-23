import React from "react";
import { Box, Typography } from "@mui/material";

export default function WorkOrderReport() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700}>
        Work Order Report
      </Typography>
    </Box>
  );
}
