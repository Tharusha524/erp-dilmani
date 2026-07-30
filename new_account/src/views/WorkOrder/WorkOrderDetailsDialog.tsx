import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
  closeWorkOrder,
  getWorkOrder,
  handOverWorkOrder,
  nextStatusWorkOrder,
  reopenWorkOrder,
  setWorkOrderStatus,
  verifyWorkOrder,
} from "../../api/WorkOrder/workOrderApi";
import { getWorkOrderStatuses, getWorkOrderStatusAssignments } from "../../api/WorkOrder/workOrderStatusApi";
import { getWorkOrderButtonAssignments, WorkOrderButtonKey } from "../../api/WorkOrder/workOrderButtonAssignmentsApi";
import { getApiBaseUrl } from "../../config/backendConfig";
import { getFriendlyApiErrorMessage } from "../../utils/apiErrorMessage";
import { useAuth } from "../../context/AuthContext";
import { formatWoDate, formatWoDateTime } from "../../utils/workOrderDateFormat";
import { formatWoAmount, formatWoQuantity } from "../../utils/workOrderNumberFormat";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
  printing_job: "Printing Job",
  embroidery_job: "Embroidery Job",
};

const storageUrl = (path: string | null): string | null => {
  if (!path) return null;
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase.replace(/\/index\.php\/api$/i, "").replace(/\/api$/i, "");
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
};

const detailRow = (label: string, value: React.ReactNode) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 130, color: "text.secondary" }}>
      {label}
    </Typography>
    <Box sx={{ fontSize: "0.875rem" }}>{value ?? "-"}</Box>
  </Stack>
);

type Props = {
  orderId: number | null;
  onClose: () => void;
};

export default function WorkOrderDetailsDialog({ orderId, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["wo-sheet-order", orderId],
    queryFn: () => getWorkOrder(orderId as number),
    enabled: orderId !== null,
  });

  const { data: allStatuses = [] } = useQuery({
    queryKey: ["wo-sheet-statuses"],
    queryFn: getWorkOrderStatuses,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["wo-sheet-status-assignments"],
    queryFn: getWorkOrderStatusAssignments,
  });

  const { data: buttonAssignments = [] } = useQuery({
    queryKey: ["wo-sheet-button-assignments"],
    queryFn: getWorkOrderButtonAssignments,
  });

  const { user } = useAuth();
  const isAdmin = (user as any)?.role?.toLowerCase() === "admin";
  const currentUserId = Number((user as any)?.id);

  // Mirrors the backend rule in WoSheetOrderController::authorizeStatusAction:
  // Admins always may act; a status with nobody assigned stays open to
  // everyone; otherwise only an assigned user may act on it.
  const currentStatusAssignees = useMemo(
    () => assignments.filter((a) => a.status_id === order?.current_status?.id),
    [assignments, order]
  );
  const canActOnCurrentStatus =
    isAdmin ||
    currentStatusAssignees.length === 0 ||
    currentStatusAssignees.some((a) => a.user_id === currentUserId);

  // Mirrors WoSheetOrderController::authorizeButtonAction: Admins always
  // may act; a button with nobody assigned stays open to everyone;
  // otherwise only an assigned user may click it.
  const canUseButton = (buttonKey: WorkOrderButtonKey) => {
    if (isAdmin) return true;
    const assignees = buttonAssignments.filter((a) => a.button_key === buttonKey);
    return assignees.length === 0 || assignees.some((a) => a.user_id === currentUserId);
  };
  const canFinish = canUseButton("finish");
  const canVerify = canUseButton("verify");
  const canHandOver = canUseButton("hand_over");
  const canReopen = canUseButton("reopen");

  const statusOptions = useMemo(() => {
    if (!order) return [];
    return allStatuses
      .filter(
        (s) => s.category === order.category && s.process_type === order.process_type && !s.inactive
      )
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }, [allStatuses, order]);

  // The order is "finished" when its current status is the last step in the workflow.
  const isFinished = useMemo(() => {
    if (!order || !statusOptions.length) return false;
    const lastStatus = statusOptions[statusOptions.length - 1];
    return order.current_status?.id === lastStatus.id;
  }, [order, statusOptions]);

  const refreshOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-orders"] });
  };

  const { mutate: nextStatus, isPending: isAdvancing } = useMutation({
    mutationFn: () => nextStatusWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Advanced to next status", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const { mutate: setStatus, isPending: isSettingStatus } = useMutation({
    mutationFn: (statusId: number) => setWorkOrderStatus(orderId as number, statusId),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Status updated", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const handleStatusSelect = (e: SelectChangeEvent<number>) => {
    const statusId = Number(e.target.value);
    if (statusId) setStatus(statusId);
  };

  const { mutate: close, isPending: isClosing } = useMutation({
    mutationFn: () => closeWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Work order closed", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to close work order", { variant: "error" }),
  });

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: () => verifyWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Work order verified — Hand Over is now available", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const { mutate: handOver, isPending: isHandingOver } = useMutation({
    mutationFn: () => handOverWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Work order handed over", { variant: "success" });
      onClose();
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const { mutate: reopen, isPending: isReopening } = useMutation({
    mutationFn: () => reopenWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Work order reopened", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to reopen work order", { variant: "error" }),
  });

  return (
    <Dialog open={orderId !== null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Work Order Details
        <IconButton onClick={onClose} sx={{ color: "inherit" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading || !order ? (
          <Typography sx={{ py: 4 }} align="center" color="text.secondary">
            Loading...
          </Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                    Order Details
                  </Typography>
                  {detailRow("WO Number", order.work_order_no)}
                  {order.invoice_reference && detailRow("Invoice Reference", order.invoice_reference)}
                  {detailRow("Created Date Time", formatWoDateTime(order.created_at))}
                  {detailRow("Updated Date Time", formatWoDateTime(order.updated_at))}
                  {detailRow("Order Date", formatWoDate(order.order_date))}
                  {detailRow("Delivery Date", formatWoDate(order.delivery_date))}
                  {detailRow("Customer", order.customer)}
                  {detailRow("Contact No", order.contact_no)}
                  {detailRow("Branch", order.branch)}
                  {detailRow("Category", CATEGORY_LABELS[order.category] || order.category)}
                  {detailRow("Kind of Fabric", order.kind_of_fabric)}
                  {detailRow(
                    "Status",
                    order.current_status ? (
                      <Chip size="small" color="primary" variant="outlined" label={order.current_status.name} />
                    ) : (
                      "-"
                    )
                  )}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                    Size Breakdown
                  </Typography>
                  {order.sizes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No sizes recorded.</Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="right">Qty</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.sizes.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.category}</TableCell>
                              <TableCell>{s.size_label}</TableCell>
                              <TableCell align="right">{formatWoQuantity(s.quantity)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            </Grid>

            {(order.front_image_path || order.back_image_path) && (
              <Grid item xs={12}>
                <Box textAlign="center">
                  <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                    Design
                  </Typography>
                  <Stack direction="row" spacing={3} justifyContent="center">
                    {order.front_image_path && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Front Design</Typography>
                        <Box
                          component="img"
                          src={storageUrl(order.front_image_path) || undefined}
                          sx={{ width: 320, height: 320, objectFit: "cover", borderRadius: 1, display: "block", border: "1px solid var(--pallet-border-blue)" }}
                        />
                      </Box>
                    )}
                    {order.back_image_path && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Back Design</Typography>
                        <Box
                          component="img"
                          src={storageUrl(order.back_image_path) || undefined}
                          sx={{ width: 320, height: 320, objectFit: "cover", borderRadius: 1, display: "block", border: "1px solid var(--pallet-border-blue)" }}
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                Items & Pricing
              </Typography>
              {order.price_items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No price items recorded.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 1, maxWidth: 500 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.price_items.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.item_name}</TableCell>
                          <TableCell align="right">{formatWoAmount(p.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {detailRow("Total Price", formatWoAmount(order.total_price))}
              {detailRow("Advance", formatWoAmount(order.advance))}
              {detailRow("Balance", formatWoAmount(order.balance))}
            </Grid>

            {order.remark && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                  Remark
                </Typography>
                <Typography variant="body2">{order.remark}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                Event Log
              </Typography>
              {order.events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No events recorded yet.</Typography>
              ) : (
                <Box sx={{ maxHeight: 260, overflowY: "auto", pr: 1 }}>
                  <Stack spacing={1}>
                    {order.events.map((ev) => {
                      const userName = ev.user
                        ? `${ev.user.first_name || ""} ${ev.user.last_name || ""}`.trim()
                        : "";
                      return (
                        <Box key={ev.id} sx={{ pb: 1, borderBottom: "1px solid var(--pallet-border-blue)" }}>
                          <Typography variant="body2" fontWeight={600}>
                            {ev.description || ev.event_type}
                            {userName && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                {" "}— by {userName}
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ev.event_datetime ? formatWoDateTime(ev.event_datetime) : formatWoDateTime(ev.created_at)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      {order && (
        <DialogActions
          sx={{
            flexWrap: "wrap",
            gap: 1,
            px: 3,
            py: 1.5,
            borderTop: "1px solid var(--pallet-border-blue)",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {!canActOnCurrentStatus && (
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                Assigned to: {currentStatusAssignees.map((a) => a.user_name).filter(Boolean).join(", ") || "another user"}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={isAdvancing || !canActOnCurrentStatus}
              onClick={() => nextStatus()}
            >
              Next Status
            </Button>
            <Select
              size="small"
              displayEmpty
              value={order.current_status?.id ?? ""}
              onChange={handleStatusSelect}
              disabled={isSettingStatus || statusOptions.length === 0 || !canActOnCurrentStatus}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="" disabled>
                {statusOptions.length === 0 ? "No statuses configured" : "Set status to..."}
              </MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.sequence_order}. {s.name}
                </MenuItem>
              ))}
            </Select>
            <Button variant="contained" color="success" disabled={isClosing || !canFinish} onClick={() => close()}>
              Finish
            </Button>
            <Button
              variant="contained"
              color="warning"
              disabled={isReopening || !isFinished || !canReopen}
              onClick={() => reopen()}
            >
              Re-Open
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={isVerifying || !canVerify || !!order.final_verify_user_id}
              onClick={() => verify()}
            >
              Verify
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={isHandingOver || !canHandOver || !order.final_verify_user_id || !!order.final_hand_over_user_id}
              onClick={() => handOver()}
            >
              Hand Over
            </Button>
          </Stack>

          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
