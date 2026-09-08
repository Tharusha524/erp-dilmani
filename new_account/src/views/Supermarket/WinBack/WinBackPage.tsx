import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Typography, Stack, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Checkbox,
  TablePagination, InputAdornment, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import { getInactiveCustomers, sendWinBackOffer, getOffers } from "../../../api/Loyalty/loyaltyApi";
import { getCustomer, updateCustomer } from "../../../api/Customer/AddCustomerApi";
import { notify } from "../../../services/notificationService";

const RECONTACT_COOLDOWN_DAYS = 7;

export default function WinBackPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(30);
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [offerId, setOfferId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  // Inline "add mobile" shortcut — fixes the #1 reason Send Offer fails
  // (customer has no phone number) without leaving this screen.
  const [editingDebtorNo, setEditingDebtorNo] = useState<number | null>(null);
  const [mobileDraft, setMobileDraft] = useState("");

  // Which customers are picked for a bulk send — sending only ever goes to
  // the customer(s) explicitly checked here (or a single row's own button),
  // never to the whole (potentially large) list.
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // A pending "already contacted recently" confirmation, so re-sending is a
  // deliberate choice, not an accident.
  const [confirmResend, setConfirmResend] = useState<{ debtorNo: number } | null>(null);

  // Bulk send runs one customer at a time (never a burst of parallel
  // requests against Notify.lk) with one progress summary — not a storm of
  // per-customer toasts.
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  const { data: inactivePage, isLoading } = useQuery({
    queryKey: ["inactive-customers", days, page, perPage, search],
    queryFn: () => getInactiveCustomers(days, { page: page + 1, per_page: perPage, search: search || undefined }),
  });
  const inactive = inactivePage?.data ?? [];
  const total = inactivePage?.total ?? 0;

  const { data: offers } = useQuery({ queryKey: ["offers"], queryFn: getOffers });

  const sendMutation = useMutation({
    mutationFn: sendWinBackOffer,
    onSuccess: (result: any) => {
      if (result?.delivery?.sent) {
        notify.success("SMS sent successfully");
      } else {
        notify.error(result?.delivery?.message || "Message was not delivered — check the offer log for details");
      }
      queryClient.invalidateQueries({ queryKey: ["inactive-customers"] });
    },
  });

  const saveMobileMutation = useMutation({
    mutationFn: async ({ debtorNo, mobile }: { debtorNo: number; mobile: string }) => {
      // The update endpoint requires the full customer payload (name, currency,
      // sales type, etc.) — fetch the current record and merge in just the
      // mobile number, rather than risk sending a partial/invalid payload.
      const full = await getCustomer(debtorNo);
      return updateCustomer(debtorNo, {
        name: full.name,
        debtor_ref: full.debtor_ref,
        address: full.address,
        gst: full.gst,
        curr_code: full.currency?.currency_abbreviation ?? full.curr_code,
        sales_type: full.sales_type?.id ?? full.sales_type,
        credit_status: full.credit_status?.id ?? full.credit_status,
        payment_terms: full.payment_term?.terms_indicator ?? full.payment_terms,
        discount: full.discount,
        pymt_discount: full.pymt_discount,
        credit_limit: full.credit_limit,
        notes: full.notes,
        cost_center_id: full.cost_center_id ?? 0,
        cost_center2_id: full.cost_center2_id ?? 0,
        inactive: full.inactive,
        mobile,
      });
    },
    onSuccess: () => {
      notify.success("Mobile number saved");
      setEditingDebtorNo(null);
      queryClient.invalidateQueries({ queryKey: ["inactive-customers"] });
    },
    onError: () => notify.error("Failed to save mobile number"),
  });

  const startEditMobile = (debtorNo: number, currentMobile: string | null) => {
    setEditingDebtorNo(debtorNo);
    setMobileDraft(currentMobile ?? "");
  };

  const sendableCustomers = inactive.filter((c: any) => !!c.mobile);
  const allSendableSelected = sendableCustomers.length > 0 && sendableCustomers.every((c: any) => selected.has(c.debtor_no));

  const toggleSelected = (debtorNo: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(debtorNo)) next.delete(debtorNo); else next.add(debtorNo);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allSendableSelected ? new Set() : new Set(sendableCustomers.map((c: any) => c.debtor_no)));
  };

  const sendOne = async (debtorNo: number) => {
    await sendMutation.mutateAsync({
      debtor_no: debtorNo,
      offer_id: offerId ? Number(offerId) : undefined,
      channel,
    });
  };

  const handleSendClick = (customer: any) => {
    if (customer.recently_contacted) {
      setConfirmResend({ debtorNo: customer.debtor_no });
      return;
    }
    sendOne(customer.debtor_no);
  };

  const confirmAndSend = () => {
    if (!confirmResend) return;
    sendOne(confirmResend.debtorNo);
    setConfirmResend(null);
  };

  const sendToSelected = async () => {
    // Same recently-contacted protection as the single "Send Offer" button
    // — a bulk send shouldn't be a way to bypass it. Anyone flagged is
    // skipped here; send to them individually (with the confirmation) if
    // that's genuinely intended.
    const byId = new Map<number, any>(inactive.map((c: any) => [c.debtor_no, c]));
    const allIds = Array.from(selected);
    const skipped = allIds.filter((id) => byId.get(id)?.recently_contacted);
    const ids = allIds.filter((id) => !byId.get(id)?.recently_contacted);

    setSelected(new Set());
    if (ids.length === 0) {
      notify.error("All selected customers were contacted recently — skipped. Use \"Send Again?\" individually if intended.");
      return;
    }

    setBulkProgress({ done: 0, total: ids.length, failed: 0 });

    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await sendOne(ids[i]);
      } catch {
        failed += 1;
      }
      setBulkProgress({ done: i + 1, total: ids.length, failed });
    }

    const skippedNote = skipped.length > 0 ? ` — ${skipped.length} skipped (contacted recently)` : "";
    notify.success(`Bulk send finished — ${ids.length - failed}/${ids.length} sent successfully${skippedNote}`);
    setBulkProgress(null);
  };

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Win-Back Campaigns" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Win-Back Campaigns" }]} />
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField
          label="Inactive for (days)"
          type="number"
          size="small"
          value={days}
          onChange={(e) => { setDays(Number(e.target.value) || 30); setPage(0); }}
        />
        <TextField
          size="small"
          placeholder="Search name or mobile"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Channel</InputLabel>
          <Select value={channel} label="Channel" onChange={(e) => setChannel(e.target.value as any)}>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Offer (optional)</InputLabel>
          <Select value={offerId} label="Offer (optional)" onChange={(e) => setOfferId(e.target.value)}>
            <MenuItem value="">None</MenuItem>
            {(offers ?? []).map((o: any) => (
              <MenuItem key={o.id} value={o.id}>{o.offer_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary">
          Note: SMS is sent live via Notify.lk. WhatsApp is not yet connected — those sends are logged only.
        </Typography>
        <Button
          variant="contained"
          startIcon={<CampaignIcon />}
          disabled={selected.size === 0 || !!bulkProgress}
          onClick={sendToSelected}
          sx={{ ml: "auto !important" }}
        >
          Send to Selected ({selected.size})
        </Button>
      </Stack>

      {bulkProgress && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Sending {bulkProgress.done}/{bulkProgress.total}{bulkProgress.failed > 0 ? ` — ${bulkProgress.failed} failed` : ""}
          </Typography>
          <LinearProgress variant="determinate" value={(bulkProgress.done / bulkProgress.total) * 100} />
        </Box>
      )}

      {isLoading ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSendableSelected}
                    indeterminate={selected.size > 0 && !allSendableSelected}
                    disabled={sendableCustomers.length === 0}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Last Purchase</TableCell>
                <TableCell>Last Contacted</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inactive.map((c: any) => (
                <TableRow key={c.debtor_no} hover selected={selected.has(c.debtor_no)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.has(c.debtor_no)}
                      disabled={!c.mobile}
                      onChange={() => toggleSelected(c.debtor_no)}
                    />
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    {editingDebtorNo === c.debtor_no ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TextField
                          size="small"
                          autoFocus
                          value={mobileDraft}
                          placeholder="07XXXXXXXX"
                          onChange={(e) => setMobileDraft(e.target.value)}
                          sx={{ width: 140 }}
                        />
                        <IconButton
                          size="small"
                          color="success"
                          disabled={saveMobileMutation.isPending || !mobileDraft.trim()}
                          onClick={() => saveMobileMutation.mutate({ debtorNo: c.debtor_no, mobile: mobileDraft.trim() })}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditingDebtorNo(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <span>{c.mobile ?? "—"}</span>
                        <Tooltip title="Add / edit mobile number">
                          <IconButton size="small" onClick={() => startEditMobile(c.debtor_no, c.mobile)}>
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>{c.last_purchase_date ? String(c.last_purchase_date).slice(0, 10) : "Never"}</TableCell>
                  <TableCell>
                    {c.last_campaign_at ? (
                      <Chip
                        size="small"
                        label={String(c.last_campaign_at).slice(0, 10)}
                        color={c.recently_contacted ? "warning" : "default"}
                        title={c.recently_contacted ? `Contacted within the last ${RECONTACT_COOLDOWN_DAYS} days` : undefined}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Never contacted</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={c.mobile ? "" : "Add a mobile number first"}>
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          color={c.recently_contacted ? "warning" : "primary"}
                          startIcon={<CampaignIcon />}
                          disabled={sendMutation.isPending || !c.mobile || !!bulkProgress}
                          onClick={() => handleSendClick(c)}
                        >
                          {c.recently_contacted ? "Send Again?" : "Send Offer"}
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {inactive.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2">No inactive customers in this window.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </TableContainer>
      )}

      <Dialog open={!!confirmResend} onClose={() => setConfirmResend(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Already Contacted Recently</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This customer was already sent a win-back message within the last {RECONTACT_COOLDOWN_DAYS} days. Send again anyway?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResend(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={confirmAndSend}>Send Anyway</Button>
        </DialogActions>
      </Dialog>
    </FormPageLayout>
  );
}
