import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Table,
  TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, Typography,
  FormControl, InputLabel, Select, MenuItem, Autocomplete, IconButton, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import {
  getLoyaltyCards, createLoyaltyCard, updateLoyaltyCard, getLoyaltyTiers,
  getLoyaltyPointsHistory, redeemLoyaltyPoints,
} from "../../../api/Loyalty/loyaltyApi";
import { getCustomers } from "../../../api/Customer/AddCustomerApi";
import { notify } from "../../../services/notificationService";

export default function LoyaltyCardsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [debtorNo, setDebtorNo] = useState<any>(null);
  const [tierId, setTierId] = useState("");
  const [ledgerCard, setLedgerCard] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState("");

  const { data: cards, isLoading } = useQuery({ queryKey: ["loyalty-cards"], queryFn: getLoyaltyCards });
  const { data: customers } = useQuery({ queryKey: ["customers-all"], queryFn: getCustomers });
  const { data: tiers } = useQuery({ queryKey: ["loyalty-tiers"], queryFn: getLoyaltyTiers });

  const createMutation = useMutation({
    mutationFn: createLoyaltyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      setOpen(false);
      setDebtorNo(null);
      setTierId("");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateLoyaltyCard(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] }),
  });

  const { data: ledgerHistory, isLoading: ledgerLoading } = useQuery({
    queryKey: ["loyalty-points-history", ledgerCard?.debtor_no],
    queryFn: () => getLoyaltyPointsHistory(ledgerCard.debtor_no),
    enabled: !!ledgerCard,
  });

  // A manual debit against the ledger — same redeemLoyaltyPoints endpoint a
  // real redemption would use, just triggered by staff for a correction
  // instead of a purchase. Writes a normal ledger row, doesn't touch the
  // point-earning formula or accounting.
  const adjustMutation = useMutation({
    mutationFn: () => redeemLoyaltyPoints({ debtor_no: ledgerCard.debtor_no, points: Number(adjustPoints) }),
    onSuccess: () => {
      notify.success("Points adjusted");
      setAdjustPoints("");
      queryClient.invalidateQueries({ queryKey: ["loyalty-points-history", ledgerCard?.debtor_no] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to adjust points"),
  });

  const handleSubmit = () => {
    if (!debtorNo) return;
    createMutation.mutate({ debtor_no: debtorNo.debtor_no, loyalty_tier_id: tierId || null });
  };

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <PageTitle title="Loyalty Cards" />
          <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Loyalty Cards" }]} />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Issue Card</Button>
      </Box>

      {isLoading ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Card No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="right">Points Balance</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Ledger</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(cards ?? []).map((card: any) => (
                <TableRow key={card.id} hover>
                  <TableCell>{card.card_no}</TableCell>
                  <TableCell>{card.debtor?.name}</TableCell>
                  <TableCell>{card.tier?.tier_name ?? "—"}</TableCell>
                  <TableCell align="right">{card.points_balance}</TableCell>
                  <TableCell>{String(card.issue_date).slice(0, 10)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={card.status}
                      size="small"
                      color={card.status === "active" ? "success" : "default"}
                      onClick={() => toggleStatusMutation.mutate({ id: card.id, status: card.status === "active" ? "blocked" : "active" })}
                      sx={{ cursor: "pointer" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View points ledger">
                      <IconButton size="small" onClick={() => setLedgerCard(card)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!cards || cards.length === 0) && (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2">No loyalty cards issued yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Loyalty Card</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={customers ?? []}
              getOptionLabel={(c: any) => c.name ?? ""}
              value={debtorNo}
              onChange={(_, val) => setDebtorNo(val)}
              renderInput={(params) => <TextField {...params} label="Customer" />}
            />
            <FormControl fullWidth>
              <InputLabel>Loyalty Tier</InputLabel>
              <Select value={tierId} label="Loyalty Tier" onChange={(e) => setTierId(e.target.value)}>
                {(tiers ?? []).map((t: any) => (
                  <MenuItem key={t.id} value={t.id}>{t.tier_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!debtorNo || createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending ? "Issuing..." : "Issue Card"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!ledgerCard} onClose={() => setLedgerCard(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Points Ledger — {ledgerCard?.debtor?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current balance: <b>{ledgerCard?.points_balance}</b> points
            </Typography>

            {ledgerLoading ? <PageLoader /> : (
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell><TableCell align="right">Earned</TableCell>
                      <TableCell align="right">Redeemed</TableCell><TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(ledgerHistory ?? []).map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.transaction_date}</TableCell>
                        <TableCell align="right" sx={{ color: t.points_earned > 0 ? "success.main" : undefined }}>
                          {t.points_earned > 0 ? `+${t.points_earned}` : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: t.points_redeemed > 0 ? "error.main" : undefined }}>
                          {t.points_redeemed > 0 ? `-${t.points_redeemed}` : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t.balance_after}</TableCell>
                      </TableRow>
                    ))}
                    {(!ledgerHistory || ledgerHistory.length === 0) && (
                      <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2">No points activity yet.</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Manually deduct points" type="number" size="small"
                value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)}
                helperText="e.g. to correct a mistaken earn"
              />
              <Button
                variant="outlined" size="small"
                disabled={!adjustPoints || Number(adjustPoints) <= 0 || adjustMutation.isPending}
                onClick={() => adjustMutation.mutate()}
              >
                {adjustMutation.isPending ? "Applying..." : "Apply"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLedgerCard(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </FormPageLayout>
  );
}
