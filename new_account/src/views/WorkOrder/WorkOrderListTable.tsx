import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getWorkOrders, WorkOrderListItem } from "../../api/WorkOrder/workOrderApi";
import WorkOrderDetailsDialog from "./WorkOrderDetailsDialog";
import { formatWoDate, formatWoDateTime } from "../../utils/workOrderDateFormat";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
};

const COLUMN_COUNT = 15;

/** Which order-sheet/job-sheet route to edit a given order in, based on
 * which department it was created under. */
const editPathFor = (wo: WorkOrderListItem): string => {
  if (wo.department === "Printing") return `/workorder/create/printing/add-work-order?editId=${wo.id}`;
  if (wo.department === "Embroidery") return `/workorder/create/embroidery/add-work-order?editId=${wo.id}`;
  return `/workorder/create/add-work-order?department=Factory&editId=${wo.id}`;
};

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

interface WorkOrderListTableProps {
  /** When set, only shows orders for this work type ("Factory" also
   * matches orders with no department set, for pre-existing orders). */
  department?: "Factory" | "Printing" | "Embroidery";
}

export default function WorkOrderListTable({ department }: WorkOrderListTableProps = {}) {
  const navigate = useNavigate();
  const { data: allWorkOrders = [], isLoading } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchWoNo, setSearchWoNo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const departmentOrders = department
    ? allWorkOrders.filter((wo) =>
        department === "Factory" ? !wo.department || wo.department === "Factory" : wo.department === department
      )
    : allWorkOrders;

  const workOrders = useMemo(() => {
    const woNoQuery = searchWoNo.trim().toLowerCase();
    const customerQuery = searchCustomer.trim().toLowerCase();
    return departmentOrders.filter((wo) => {
      if (woNoQuery && !wo.work_order_no.toLowerCase().includes(woNoQuery)) return false;
      if (customerQuery && !(wo.customer || "").toLowerCase().includes(customerQuery)) return false;
      if (searchDate) {
        const woDate = (wo.order_date || wo.created_at)?.slice(0, 10);
        if (woDate !== searchDate) return false;
      }
      return true;
    });
  }, [departmentOrders, searchWoNo, searchCustomer, searchDate]);

  return (
    <Box mt={3} sx={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {department ? `List of ${department} work orders` : "List of all work orders"}
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <TextField
          label="Work Order No"
          size="small"
          value={searchWoNo}
          onChange={(e) => setSearchWoNo(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Customer"
          size="small"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Stack>
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
                "Work Order No",
                "Created Date Time",
                "Customer",
                "Branch",
                "By",
                "Assigned To",
                "Category",
                "Qty",
                "Delivery Date",
                "Days In Progress",
                "Balance",
                "Status",
                "ReOpen",
                "Edit",
              ].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    ...cellSx,
                    fontWeight: 700,
                    backgroundColor: "var(--pallet-lighter-blue)",
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
                  <TableCell sx={cellSx}>{formatWoDateTime(wo.created_at)}</TableCell>
                  <TableCell sx={cellSx}>{wo.customer || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.branch || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.created_by || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.assigned_to || "-"}</TableCell>
                  <TableCell sx={cellSx}>{CATEGORY_LABELS[wo.category] || wo.category}</TableCell>
                  <TableCell sx={cellSx}>{wo.order_quantity ?? "-"}</TableCell>
                  <TableCell sx={cellSx}>{formatWoDate(wo.delivery_date)}</TableCell>
                  <TableCell sx={cellSx}>{daysInProgress(wo)}</TableCell>
                  <TableCell sx={cellSx}>{wo.balance ?? "-"}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip label={wo.status_name || "-"} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell sx={cellSx}>{wo.reopen_datetime ? "Yes" : "-"}</TableCell>
                  <TableCell sx={{ ...cellSx, borderRight: "none" }} align="center">
                    <Tooltip title="Edit this work order">
                      <IconButton size="small" onClick={() => navigate(editPathFor(wo))}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
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
