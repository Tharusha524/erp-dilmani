import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import {
  purchasesGlJournalPath,
  type PurchasesGlJournalNavState,
} from "../../utils/purchasesGlNavigation";
import { PURCHASE_TRANS_TYPE_LABELS } from "../../utils/purchasesGlJournalLines";

const TYPE_OPTIONS = [
  { value: 25, label: PURCHASE_TRANS_TYPE_LABELS[25] },
  { value: 20, label: PURCHASE_TRANS_TYPE_LABELS[20] },
  { value: 21, label: PURCHASE_TRANS_TYPE_LABELS[21] },
  { value: 22, label: PURCHASE_TRANS_TYPE_LABELS[22] },
];

export default function PurchasesGlJournalLookup() {
  const navigate = useNavigate();
  const [transType, setTransType] = useState<string>("20");
  const [transNo, setTransNo] = useState("");
  const [reference, setReference] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [grnBatchId, setGrnBatchId] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    const payload: PurchasesGlJournalNavState = {};
    const no = transNo.trim();
    const ref = reference.trim();
    const order = orderNo.trim();
    const grnId = grnBatchId.trim();

    if (no) {
      payload.trans_no = Number(no);
      payload.trans_type = Number(transType);
    } else if (grnId) {
      payload.grnBatchId = Number(grnId);
      payload.trans_no = Number(grnId);
      payload.trans_type = 25;
    } else if (ref) {
      payload.reference = ref;
      if (transType) {
        payload.trans_type = Number(transType);
      }
    } else if (order) {
      payload.orderNo = Number(order);
    } else {
      setError("Enter a transaction #, reference, GRN batch id, or purchase order #.");
      return;
    }

    if (date.trim()) {
      payload.date = date.trim();
    }

    setError("");
    navigate(purchasesGlJournalPath(payload), { replace: true, state: payload });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Find purchase GL postings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Open GL from a transaction success screen, or search here. For supplier
        invoices use type <strong>Supplier Invoice</strong> and the transaction
        number from Supplier Transaction Inquiry.
      </Typography>

      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={2} maxWidth={480}>
        <TextField
          select
          label="Transaction type"
          size="small"
          value={transType}
          onChange={(e) => setTransType(e.target.value)}
          fullWidth
        >
          {TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Transaction #"
          size="small"
          type="number"
          value={transNo}
          onChange={(e) => setTransNo(e.target.value)}
          helperText="Supplier invoice / payment / credit note number, or GRN batch id for deliveries"
          fullWidth
        />

        <TextField
          label="Reference"
          size="small"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. 001/2026-2027"
          fullWidth
        />

        <TextField
          label="GRN batch id (optional)"
          size="small"
          type="number"
          value={grnBatchId}
          onChange={(e) => setGrnBatchId(e.target.value)}
          fullWidth
        />

        <TextField
          label="Purchase order # (optional)"
          size="small"
          type="number"
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          fullWidth
        />

        <TextField
          label="Transaction date (optional)"
          size="small"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <Box>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Show GL entries
          </Button>
          <Button
            sx={{ ml: 1 }}
            variant="text"
            onClick={() =>
              navigate("/purchase/inquiriesandreports/supplier-transaction-inquiry")
            }
          >
            Supplier Transaction Inquiry
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
