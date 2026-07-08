import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getCurrencies } from "../api/Currency/currencyApi";
import { getSalesTypes } from "../api/SalesMaintenance/salesService";
import {
  createSalesPricing,
  getSalesPricingByStockId,
  updateSalesPricing,
} from "../api/SalesPricing/SalesPricingApi";
import { pricingCurrencyCode, pickPricingForSalesType } from "../utils/resolveSalesItemPrice";

interface ItemUsdSalesPricingPanelProps {
  stockId: string;
  onSaved?: () => void;
}

export default function ItemUsdSalesPricingPanel({
  stockId,
  onSaved,
}: ItemUsdSalesPricingPanelProps) {
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailId, setRetailId] = useState<number | null>(null);
  const [wholesaleId, setWholesaleId] = useState<number | null>(null);
  const [usdCurrencyId, setUsdCurrencyId] = useState<number | null>(null);
  const [retailTypeId, setRetailTypeId] = useState<number | null>(null);
  const [wholesaleTypeId, setWholesaleTypeId] = useState<number | null>(null);
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
        const [currencies, salesTypes, pricingList] = await Promise.all([
          getCurrencies(),
          getSalesTypes(),
          getSalesPricingByStockId(stockId),
        ]);

        if (cancelled) return;

        const usd = (currencies || []).find(
          (c: any) =>
            String(c.currency_abbreviation || "").toUpperCase() === "USD"
        );
        const retail = (salesTypes || []).find(
          (s: any) => String(s.typeName || "").toLowerCase() === "retail"
        );
        const wholesale = (salesTypes || []).find(
          (s: any) => String(s.typeName || "").toLowerCase() === "wholesale"
        );

        setUsdCurrencyId(usd?.id ?? null);
        setRetailTypeId(retail?.id ?? null);
        setWholesaleTypeId(wholesale?.id ?? null);

        const retailPricing = retail
          ? pickPricingForSalesType(pricingList, stockId, retail.id, "USD", "USD")
          : null;
        const wholesalePricing = wholesale
          ? pickPricingForSalesType(pricingList, stockId, wholesale.id, "USD", "USD")
          : null;

        setRetailId(retailPricing?.id ?? null);
        setWholesaleId(wholesalePricing?.id ?? null);
        setRetailPrice(
          retailPricing?.price != null ? String(retailPricing.price) : ""
        );
        setWholesalePrice(
          wholesalePricing?.price != null ? String(wholesalePricing.price) : ""
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Failed to load USD sales pricing.");
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

  const canSave = useMemo(
    () => Boolean(usdCurrencyId && retailTypeId && wholesaleTypeId && stockId),
    [usdCurrencyId, retailTypeId, wholesaleTypeId, stockId]
  );

  const upsertPrice = async (
    existingId: number | null,
    salesTypeId: number,
    price: number
  ) => {
    const payload = {
      stock_id: stockId,
      currency_id: usdCurrencyId,
      sales_type_id: salesTypeId,
      price,
    };

    if (existingId) {
      return updateSalesPricing(existingId, payload);
    }
    return createSalesPricing(payload);
  };

  const handleSave = async () => {
    if (!canSave || !usdCurrencyId || !retailTypeId || !wholesaleTypeId) {
      setError("USD currency or Retail/Wholesale price lists are not configured.");
      return;
    }

    const retail = Number(retailPrice);
    const wholesale = Number(wholesalePrice);

    if (!Number.isFinite(retail) || retail < 0) {
      setError("Enter a valid USD retail price.");
      return;
    }
    if (!Number.isFinite(wholesale) || wholesale < 0) {
      setError("Enter a valid USD wholesale price.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await upsertPrice(retailId, retailTypeId, retail);
      await upsertPrice(wholesaleId, wholesaleTypeId, wholesale);
      setMessage("USD retail and wholesale prices saved.");
      onSaved?.();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to save USD sales pricing."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading pricing…
        </Typography>
      </Paper>
    );
  }

  if (!usdCurrencyId || !retailTypeId || !wholesaleTypeId) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Configure USD currency and Retail / Wholesale sales types before adding USD
        item prices.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            USD Sales Prices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            USD customers will see these prices on sales transactions.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Retail Price"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Wholesale Price"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
        </Grid>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}

        <Box>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save USD Prices"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
