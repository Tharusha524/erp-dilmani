import React from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getWorkOrders } from "../../api/WorkOrder/workOrderApi";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
};

export default function WorkOrderListTable() {
  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });

  return (
    <Box mt={3}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        List of all work orders
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>WO</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>By</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ReOpen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Loading...</TableCell>
              </TableRow>
            ) : workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No work orders yet.</TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo, index) => (
                <TableRow key={wo.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{wo.work_order_no}</TableCell>
                  <TableCell>{new Date(wo.created_at).toLocaleString()}</TableCell>
                  <TableCell>{wo.department || "-"}</TableCell>
                  <TableCell>{wo.created_by || "-"}</TableCell>
                  <TableCell>{CATEGORY_LABELS[wo.category] || wo.category}</TableCell>
                  <TableCell>{wo.description || "-"}</TableCell>
                  <TableCell>
                    <Chip label={wo.status_name || "-"} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{wo.reopen_datetime ? "Yes" : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
