import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router";
import { APP_ROUTER_BASENAME } from "../../config/appConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteWorkOrder, getWorkOrders, WorkOrderListItem } from "../../api/WorkOrder/workOrderApi";
import WorkOrderDetailsDialog from "./WorkOrderDetailsDialog";
import { formatWoDate, formatWoDateTime } from "../../utils/workOrderDateFormat";
import { formatWoAmount, formatWoQuantity } from "../../utils/workOrderNumberFormat";
import { getSysPrefs } from "../../api/OrganizationSettings/SysPrefsApi";
import { WO_DUE_COLOR_DEFAULTS } from "./WorkOrderDueDateColorSettings";
import { getFriendlyApiErrorMessage } from "../../utils/apiErrorMessage";
import { enqueueSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";
import {
  getWorkOrderButtonAssignments,
  WorkOrderButtonKey,
} from "../../api/WorkOrder/workOrderButtonAssignmentsApi";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
  printing_job: "Printing Job",
  embroidery_job: "Embroidery Job",
};

const COLUMN_COUNT = 18;

/** Opens the full printable order sheet for a work order in a new tab. */
const openPrintSheet = (id: number) => {
  window.open(`${APP_ROUTER_BASENAME}workorder/print/${id}`, "_blank", "noopener");
};

/** Which order-sheet/job-sheet route to edit a given order in, based on
 * which department it was created under. */
const editPathFor = (wo: WorkOrderListItem): string => {
  if (wo.department === "Printing") return `/workorder/create/printing/add-work-order?editId=${wo.id}`;
  if (wo.department === "Embroidery") return `/workorder/create/embroidery/add-work-order?editId=${wo.id}`;
  return `/workorder/create/add-work-order?department=Factory&editId=${wo.id}`;
};

/** Which department suffix (matching the backend's edit_/print_/delete_
 * button keys) a work order's department maps to. */
const departmentSuffix = (department?: string | null): "factory" | "printing" | "embroidery" => {
  if (department === "Printing") return "printing";
  if (department === "Embroidery") return "embroidery";
  return "factory";
};

const cellSx = {
  borderRight: "1px solid var(--pallet-border-blue)",
  whiteSpace: "nowrap",
  "&:last-of-type": { borderRight: "none" },
} as const;

/** Calendar days remaining until the delivery date (negative once overdue). */
const daysUntilDue = (wo: WorkOrderListItem): number | null => {
  if (!wo.delivery_date) return null;
  const deliveryDateOnly = new Date(`${wo.delivery_date.slice(0, 10)}T00:00:00`);
  const todayDateOnly = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const diffMs = deliveryDateOnly.getTime() - todayDateOnly.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/** Row highlight based on how close the delivery date is (urgent/warning/safe). */
const dueDateRowColor = (
  days: number | null,
  colors: { urgent: string; warning: string; safe: string }
): string | undefined => {
  if (days === null) return undefined;
  if (days <= 2) return colors.urgent;
  if (days <= 7) return colors.warning;
  return colors.safe;
};

interface WorkOrderListTableProps {
  /** When set, only shows orders for this work type ("Factory" also
   * matches orders with no department set, for pre-existing orders). */
  department?: "Factory" | "Printing" | "Embroidery";
}

export default function WorkOrderListTable({ department }: WorkOrderListTableProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allWorkOrders = [], isLoading } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });
  const { data: buttonAssignments = [] } = useQuery({
    queryKey: ["wo-sheet-button-assignments"],
    queryFn: getWorkOrderButtonAssignments,
  });

  /** Mirrors the backend's authorizeButtonAction: Admins may always act;
   * otherwise a button with no assignments is open to everyone, and a
   * button with assignments is restricted to those assigned users. */
  const canUseButton = (action: "edit" | "print" | "delete", wo: WorkOrderListItem): boolean => {
    if (user && (user.role || "").toLowerCase() === "admin") return true;
    const key = `${action}_${departmentSuffix(wo.department)}` as WorkOrderButtonKey;
    const assignedIds = buttonAssignments.filter((a) => a.button_key === key).map((a) => a.user_id);
    if (assignedIds.length === 0) return true;
    return !!user && assignedIds.includes(user.id);
  };
  const { data: sysPrefs = [] } = useQuery({
    queryKey: ["sys-prefs"],
    queryFn: getSysPrefs,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchWoNo, setSearchWoNo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkOrderListItem | null>(null);
  const queryClient = useQueryClient();

  const { mutate: removeWorkOrder, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wo-sheet-orders"] });
      enqueueSnackbar("Work order deleted", { variant: "success" });
      setPendingDelete(null);
    },
    onError: (error) => {
      enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" });
      setPendingDelete(null);
    },
  });

  const dueColors = useMemo(() => {
    const colors = { ...WO_DUE_COLOR_DEFAULTS };
    (Object.keys(colors) as (keyof typeof colors)[]).forEach((key) => {
      const pref = sysPrefs.find((p) => p.name === `wo_due_color_${key}`);
      if (pref?.value) colors[key] = pref.value;
    });
    return colors;
  }, [sysPrefs]);

  // Once an order is handed over it's fully complete and drops off the
  // active work-order list (Analytics/Report still count it via is_handed_over).
  const activeWorkOrders = allWorkOrders.filter((wo) => !wo.is_handed_over);

  const departmentOrders = department
    ? activeWorkOrders.filter((wo) =>
        department === "Factory" ? !wo.department || wo.department === "Factory" : wo.department === department
      )
    : activeWorkOrders;

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
                "Status",
                "Delivery Date",
                "Customer",
                "Branch",
                "By",
                "Assigned To",
                "Category",
                "Qty",
                "Updated Date Time",
                "Due Date",
                "Balance(Rs.)",
                "ReOpen",
                "Print",
                "Edit",
                "Delete",
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
              workOrders.map((wo, index) => {
                const rowColor = dueDateRowColor(daysUntilDue(wo), dueColors);
                return (
                <TableRow
                  key={wo.id}
                  hover
                  sx={{
                    backgroundColor: rowColor,
                    "&:nth-of-type(odd)": rowColor
                      ? undefined
                      : {
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
                      {wo.is_finished && (
                        <span style={{ color: "red", marginLeft: 4, fontSize: "1rem" }}>*</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell sx={cellSx}>{formatWoDateTime(wo.created_at)}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip label={wo.status_name || "-"} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell sx={cellSx}>{formatWoDate(wo.delivery_date)}</TableCell>
                  <TableCell sx={cellSx}>{wo.customer || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.branch || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.created_by || "-"}</TableCell>
                  <TableCell sx={cellSx}>{wo.assigned_to || "-"}</TableCell>
                  <TableCell sx={cellSx}>{CATEGORY_LABELS[wo.category] || wo.category}</TableCell>
                  <TableCell sx={cellSx}>{formatWoQuantity(wo.order_quantity)}</TableCell>
                  <TableCell sx={cellSx}>{formatWoDateTime(wo.updated_at)}</TableCell>
                  <TableCell sx={cellSx}>{daysUntilDue(wo) ?? "-"}</TableCell>
                  <TableCell sx={cellSx}>{formatWoAmount(wo.balance)}</TableCell>
                  <TableCell sx={cellSx}>{wo.reopen_datetime ? "Yes" : "-"}</TableCell>
                  <TableCell sx={cellSx} align="center">
                    <Tooltip title={canUseButton("print", wo) ? "Print full order sheet" : "You're not authorized to print this order"}>
                      <span>
                        <IconButton size="small" onClick={() => openPrintSheet(wo.id)} disabled={!canUseButton("print", wo)}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={cellSx} align="center">
                    <Tooltip title={canUseButton("edit", wo) ? "Edit this work order" : "You're not authorized to edit this order"}>
                      <span>
                        <IconButton size="small" onClick={() => navigate(editPathFor(wo))} disabled={!canUseButton("edit", wo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, borderRight: "none" }} align="center">
                    <Tooltip title={canUseButton("delete", wo) ? "Delete this work order" : "You're not authorized to delete this order"}>
                      <span>
                        <IconButton size="small" color="error" onClick={() => setPendingDelete(wo)} disabled={!canUseButton("delete", wo)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <WorkOrderDetailsDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete work order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingDelete?.invoice_reference ? (
              <>
                <strong>{pendingDelete.work_order_no}</strong> is linked to invoice{" "}
                <strong>{pendingDelete.invoice_reference}</strong>. Deleting it removes that link
                permanently — the invoice itself will keep working, but this won't be traceable
                to it anymore. Only an Admin can do this. Continue?
              </>
            ) : (
              <>
                Delete <strong>{pendingDelete?.work_order_no}</strong>? This can't be undone.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDeleting}
            onClick={() => pendingDelete && removeWorkOrder(pendingDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
