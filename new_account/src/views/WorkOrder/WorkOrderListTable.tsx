import React, { useState } from "react";
import {
  Box,
  Chip,
  Link,
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
import { getWorkOrders, WorkOrderListItem } from "../../api/WorkOrder/workOrderApi";
import WorkOrderDetailsDialog from "./WorkOrderDetailsDialog";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
};

const COLUMN_COUNT = 15;

const cellSx = {
  borderRight: "1px solid var(--pallet-border-blue)",
  whiteSpace: "nowrap",
  "&:last-of-type": { borderRight: "none" },
} as const;

const daysInProgress = (wo: WorkOrderListItem): number => {
  const start = new Date(wo.order_date || wo.created_at);
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export default function WorkOrderListTable() {
  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  return (
    <Box mt={3} sx={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        List of all work orders
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          width: "100%",
          minWidth: 0,
          overflowX: "auto",
          borderRadius: 2,
          border: "1px solid var(--pallet-border-blue)",
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 1500, borderCollapse: "separate" }}>
          <TableHead>
            <TableRow>
              {[
                "#",
                "WO",
                "Time",
                "Customer",
                "Branch",
                "Department",
                "By",
                "Assigned To",
                "Category",
                "Qty",
                "Delivery Date",
                "Days In Progress",
                "Balance",
                "Status",
                "ReOpen",
              ].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    ...cellSx,
                    fontWeight: 700,
                    backgroundColor: "var(--pallet-lighter-blue)",
                    color: (theme) => (theme.palette.mode === "dark" ? "#0f172a" : "inherit"),
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} align="center">Loading...</TableCell>
              </TableRow>
            ) : workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} align="center">No work orders yet.</TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo, index) => (
                <TableRow
                  key={wo.id}
                  hover
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  <TableCell sx={cellSx}>{index + 1}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => setSelectedOrderId(wo.id)}
                      sx={{ fontWeight: 600 }}
                    >
                      {wo.work_order_no}
                    </Link>
                  </TableCell>
                  <TableCell sx={cellSx}>{new Date(wo.created_at).toLocaleString()}</TableCell>
                  <TableCell sx={cellSx}>{wo.customer || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.branch || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.department || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.created_by || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.assigned_to || "-"}</TableCell>
                  <TableCell sx={cellSx}>{CATEGORY_LABELS[wo.category] || wo.category}</TableCell>
                  <TableCell sx={cellSx}>{wo.order_quantity ?? "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.delivery_date ? new Date(wo.delivery_date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell sx={cellSx}>{daysInProgress(wo)}</TableCell>
                  <TableCell sx={cellSx}>{wo.balance ?? "-"}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip label={wo.status_name || "-"} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ ...cellSx, borderRight: "none" }}>{wo.reopen_datetime ? "Yes" : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <WorkOrderDetailsDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </Box>
  );
}
