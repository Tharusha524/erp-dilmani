import React, { useEffect, useMemo, useState } from "react";
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
import { getSuppliers } from "../api/Supplier/SupplierApi";
import {
  createPurchData,
  getPurchDataById,
  updatePurchData,
} from "../api/PurchasingPricing/PurchasingPricingApi";
import { supplierCurrencyCode } from "../utils/relationId";

interface ItemUsdSupplierPricingPanelProps {
  stockId: string;
  onSaved?: () => void;
}

function resolveSupplierId(s: any): number | null {
  const id = s?.supplier_id ?? s?.id ?? s?.supp_id ?? null;
  return id != null ? Number(id) : null;
}

export default function ItemUsdSupplierPricingPanel({
  stockId,
  onSaved,
}: ItemUsdSupplierPricingPanelProps) {
  const [usdSuppliers, setUsdSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const suppliers = await getSuppliers();
        if (cancelled) return;

        const usd = (suppliers || []).filter(
          (s: any) => supplierCurrencyCode(s) === "USD"
        );
        setUsdSuppliers(usd);

        if (usd.length === 1) {
          const sid = resolveSupplierId(usd[0]);
          if (sid) {
            setSupplierId(String(sid));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Failed to load USD suppliers.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stockId]);

  useEffect(() => {
    let cancelled = false;
    const sid = Number(supplierId);

    if (!sid || !stockId) {
      setPrice("");
      return;
    }

    (async () => {
      try {
        const purch = await getPurchDataById(sid, stockId);
        if (!cancelled) {
          setPrice(purch?.price != null ? String(purch.price) : "");
        }
      } catch {
        if (!cancelled) {
          setPrice("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supplierId, stockId]);

  const canSave = useMemo(
    () => Boolean(supplierId && stockId),
    [supplierId, stockId]
  );

  const handleSave = async () => {
    const sid = Number(supplierId);
    const amount = Number(price);

    if (!sid) {
      setError("Select a USD supplier.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid USD purchase price.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        supplier_id: sid,
        stock_id: stockId,
        price: amount,
        suppliers_uom: "",
        conversion_factor: 1,
      };

      try {
        await getPurchDataById(sid, stockId);
        await updatePurchData(sid, stockId, payload);
      } catch {
        await createPurchData(payload);
      }

      setMessage("USD supplier purchase price saved.");
      onSaved?.();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to save USD purchase price."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading USD purchase pricing…
        </Typography>
      </Paper>
    );
  }

  if (usdSuppliers.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No USD suppliers found. Set a supplier&apos;s currency to USD in supplier
        maintenance, then add purchase prices here.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            USD Purchase Price
          </Typography>
          <Typography variant="body2" color="text.secondary">
            USD suppliers will use this price on purchase transactions.
          </Typography>
        </Box>

        <TextField
          select
          fullWidth
          size="small"
          label="USD Supplier"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <MenuItem value="">Select supplier</MenuItem>
          {usdSuppliers.map((s) => {
            const sid = resolveSupplierId(s);
            return (
              <MenuItem key={String(sid)} value={String(sid)}>
                {s.supp_name ?? s.name ?? s.supplier_name}
              </MenuItem>
            );
          })}
        </TextField>

        <TextField
          fullWidth
          size="small"
          type="number"
          label="USD Purchase Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}

        <Box>
          <Button variant="contained" onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : "Save USD Purchase Price"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
