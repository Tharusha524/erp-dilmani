import React from "react";
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
  checkInWorkOrder,
  closeWorkOrder,
  getWorkOrder,
  nextStatusWorkOrder,
  reopenWorkOrder,
  verifyWorkOrder,
} from "../../api/WorkOrder/workOrderApi";
import { getApiBaseUrl } from "../../config/backendConfig";
import { getFriendlyApiErrorMessage } from "../../utils/apiErrorMessage";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
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

  const refreshOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-orders"] });
  };

  const { mutate: checkIn, isPending: isCheckingIn } = useMutation({
    mutationFn: () => checkInWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Checked in", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to check in", { variant: "error" }),
  });

  const { mutate: nextStatus, isPending: isAdvancing } = useMutation({
    mutationFn: () => nextStatusWorkOrder(orderId as number),
    onSuccess: () => {
      refreshOrder();
      enqueueSnackbar("Advanced to next status", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

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
      enqueueSnackbar("Work order verified", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to verify work order", { variant: "error" }),
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
                  {detailRow("Order Date", order.order_date ? new Date(order.order_date).toLocaleDateString() : "-")}
                  {detailRow("Delivery Date", order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "-")}
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
                              <TableCell align="right">{s.quantity}</TableCell>
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
                          <TableCell align="right">{p.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {detailRow("Total Price", order.total_price)}
              {detailRow("Advance", order.advance)}
              {detailRow("Balance", order.balance)}
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
                <Stack spacing={1}>
                  {order.events.map((ev) => (
                    <Box key={ev.id} sx={{ pb: 1, borderBottom: "1px solid var(--pallet-border-blue)" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {ev.description || ev.event_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ev.event_datetime ? new Date(ev.event_datetime).toLocaleString() : new Date(ev.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
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
            <Button variant="contained" color="info" disabled={isCheckingIn} onClick={() => checkIn()}>
              Check In
            </Button>
            <Button variant="contained" color="primary" disabled={isAdvancing} onClick={() => nextStatus()}>
              Next Status
            </Button>
            <Button variant="contained" color="success" disabled={isClosing} onClick={() => close()}>
              Close WO
            </Button>
            <Button variant="contained" color="secondary" disabled={isVerifying} onClick={() => verify()}>
              Verify
            </Button>
            <Button variant="contained" color="warning" disabled={isReopening} onClick={() => reopen()}>
              Re-Open
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
