import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Table,
  TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import { getPosShifts, openPosShift, closePosShift } from "../../../api/Pos/posApi";
import { getShiftDayEndSummary } from "../../../api/Pos/posAdvancedApi";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";

export default function PosShiftPage() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { formatCurrency } = useHomeCurrency();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialogId, setCloseDialogId] = useState<number | null>(null);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [closingExpected, setClosingExpected] = useState("0");
  const [closingCounted, setClosingCounted] = useState("0");
  const [summaryShiftId, setSummaryShiftId] = useState<number | null>(null);

  const { data: shifts, isLoading } = useQuery({ queryKey: ["pos-shifts"], queryFn: () => getPosShifts() });

  const { data: daySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["shift-day-end", summaryShiftId],
    queryFn: () => getShiftDayEndSummary(summaryShiftId!),
    enabled: summaryShiftId !== null,
  });

  const openMutation = useMutation({
    mutationFn: openPosShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-shifts"] });
      setOpenDialog(false);
      setOpeningFloat("0");
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => closePosShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-shifts"] });
      setCloseDialogId(null);
    },
  });

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <PageTitle title="POS Shifts" />
          <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "POS Shifts" }]} />
        </Box>
        <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setOpenDialog(true)}>Open Shift</Button>
      </Box>

      {isLoading ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Cashier</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell align="right">Opening Float</TableCell>
                <TableCell align="right">Variance</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(shifts ?? []).map((s: any) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.user?.name}</TableCell>
                  <TableCell>{new Date(s.shift_start).toLocaleString()}</TableCell>
                  <TableCell>{s.shift_end ? new Date(s.shift_end).toLocaleString() : "—"}</TableCell>
                  <TableCell align="right">{s.opening_float}</TableCell>
                  <TableCell align="right">{s.variance ?? "—"}</TableCell>
                  <TableCell align="center">
                    <Chip label={s.status} size="small" color={s.status === "open" ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {s.status === "open" && (
                        <Button size="small" variant="outlined" color="warning" startIcon={<StopIcon />} onClick={() => setCloseDialogId(s.id)}>
                          Close
                        </Button>
                      )}
                      <Button size="small" variant="text" startIcon={<SummarizeIcon />} onClick={() => setSummaryShiftId(s.id)}>
                        Day-End Summary
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {(!shifts || shifts.length === 0) && (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2">No shifts recorded yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Open Shift</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Opening Float" type="number" fullWidth value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={openMutation.isPending || !user?.id}
            onClick={() => openMutation.mutate({ user_id: Number(user!.id), opening_float: Number(openingFloat) || 0 })}
          >
            {openMutation.isPending ? "Opening..." : "Open Shift"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={closeDialogId !== null} onClose={() => setCloseDialogId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Close Shift — Cash Up</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Expected Cash" type="number" fullWidth value={closingExpected} onChange={(e) => setClosingExpected(e.target.value)} />
            <TextField label="Counted Cash" type="number" fullWidth value={closingCounted} onChange={(e) => setClosingCounted(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogId(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={closeMutation.isPending}
            onClick={() => closeMutation.mutate({
              id: closeDialogId!,
              data: { closing_expected: Number(closingExpected) || 0, closing_counted: Number(closingCounted) || 0 },
            })}
          >
            {closeMutation.isPending ? "Closing..." : "Close Shift"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={summaryShiftId !== null} onClose={() => setSummaryShiftId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Shift Day-End Summary</DialogTitle>
        <DialogContent>
          {summaryLoading ? <PageLoader /> : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {daySummary?.shift?.cashier_name} — {daySummary?.shift?.shift_start ? new Date(daySummary.shift.shift_start).toLocaleString() : ""}
                {daySummary?.shift?.shift_end ? ` to ${new Date(daySummary.shift.shift_end).toLocaleString()}` : " (still open)"}
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow><TableCell>Payment Method</TableCell><TableCell align="right">Bills</TableCell><TableCell align="right">Total</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {(daySummary?.by_payment_method ?? []).map((r: any) => (
                      <TableRow key={r.bank_account_id}>
                        <TableCell>{r.method}</TableCell>
                        <TableCell align="right">{r.bill_count}</TableCell>
                        <TableCell align="right">{formatCurrency(r.total)}</TableCell>
                      </TableRow>
                    ))}
                    {(!daySummary?.by_payment_method || daySummary.by_payment_method.length === 0) && (
                      <TableRow><TableCell colSpan={3} align="center"><Typography variant="body2">No sales tagged to this shift.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>Total Sales</Typography>
                <Typography variant="subtitle1" fontWeight={700}>{formatCurrency(daySummary?.total_sales ?? 0)}</Typography>
              </Stack>
              {daySummary?.shift?.status === "closed" && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Cash Variance (counted − expected)</Typography>
                  <Typography variant="body2" color={Number(daySummary.shift.variance) < 0 ? "error.main" : "text.primary"}>
                    {formatCurrency(daySummary.shift.variance ?? 0)}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryShiftId(null)}>Close</Button>
          <Button variant="contained" onClick={() => window.print()}>Print</Button>
        </DialogActions>
      </Dialog>
    </FormPageLayout>
  );
}
