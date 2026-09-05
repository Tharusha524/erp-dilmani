import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, Autocomplete, Button, Typography, Divider,
  InputAdornment, Table, TableHead, TableRow, TableCell, TableBody, Chip,
} from "@mui/material";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import { getStockList } from "../../../api/Inventory/StockListApi";
import { createItemCode } from "../../../api/ItemCodes/ItemCodesApi";
import { getSalesPricingByStockId, createSalesPricing, updateSalesPricing } from "../../../api/SalesPricing/SalesPricingApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";
import { notify } from "../../../services/notificationService";

const LKR_CURRENCY_ID = 8; // only currency configured in this system
const RETAIL_SALES_TYPE_ID = 3; // default price list for supermarket walk-in sales

/**
 * Set the Selling Price for products already purchased and sitting in
 * inventory — separate from Purchase Cost. Uses the ERP's already-existing
 * Sales Pricing feature (sales_pricing table) — genuine, real pricing data
 * the same way the full Item Maintenance → Pricing screen would, just a
 * short, barcode-friendly front end over it. Pure master-data — no GL
 * entries, no stock movement, nothing accounting-related happens here.
 */
export default function SetPricePage() {
  const { formatCurrency } = useHomeCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [margin, setMargin] = useState("20");
  const [sellingPrice, setSellingPrice] = useState("");
  const [lastEdited, setLastEdited] = useState<"margin" | "price">("margin");
  const [newBarcode, setNewBarcode] = useState("");

  const { data: results } = useQuery({
    queryKey: ["stock-search", search],
    queryFn: () => getStockList({ search: search || undefined }),
    enabled: search.length > 0,
  });

  const { data: existingPricing } = useQuery({
    queryKey: ["sales-pricing", product?.stock_id],
    queryFn: () => getSalesPricingByStockId(product.stock_id),
    enabled: !!product,
  });

  const currentPricing = (existingPricing ?? []).find(
    (p: any) => p.sales_type_id === RETAIL_SALES_TYPE_ID && p.currency_id === LKR_CURRENCY_ID
  );

  const cost = Number(product?.purchase_cost) || 0;

  // Selling price and margin stay in sync with each other — editing either
  // one recalculates the other, whichever the user touched last wins.
  useEffect(() => {
    if (!product) return;
    if (lastEdited === "margin") {
      const computed = cost * (1 + (Number(margin) || 0) / 100);
      setSellingPrice(computed ? computed.toFixed(2) : "");
    }
  }, [margin, cost, product, lastEdited]);

  useEffect(() => {
    if (!product) return;
    if (lastEdited === "price" && cost > 0) {
      const computedMargin = ((Number(sellingPrice) || 0) - cost) / cost * 100;
      setMargin(computedMargin.toFixed(1));
    }
  }, [sellingPrice, cost, product, lastEdited]);

  const selectProduct = (p: any) => {
    setProduct(p);
    setSearch("");
    setMargin("20");
    setLastEdited("margin");
    setNewBarcode("");
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        stock_id: product.stock_id,
        currency_id: LKR_CURRENCY_ID,
        sales_type_id: RETAIL_SALES_TYPE_ID,
        price: Number(sellingPrice) || 0,
      };
      return currentPricing
        ? updateSalesPricing(currentPricing.id, payload)
        : createSalesPricing(payload);
    },
    onSuccess: () => {
      notify.success("Selling price saved");
      queryClient.invalidateQueries({ queryKey: ["sales-pricing", product?.stock_id] });
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to save selling price"),
  });

  // Links a real manufacturer barcode to the already-selected product — the
  // same Foreign Item Code mechanism used everywhere else in this ERP.
  // Pure identification data (barcode number -> stock_id), no GL/tax/cost
  // fields involved, so it can't affect accounting.
  const linkBarcodeMutation = useMutation({
    mutationFn: () => createItemCode({
      item_code: newBarcode.trim(),
      stock_id: product.stock_id,
      description: product.description,
      category_id: product.category_id,
      quantity: 1,
      is_foreign: true,
    }),
    onSuccess: () => {
      notify.success("Barcode linked to this product");
      queryClient.invalidateQueries({ queryKey: ["stock-search"] });
      setProduct((prev: any) => (prev ? { ...prev, barcode: newBarcode.trim() } : prev));
      setNewBarcode("");
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to link barcode — it may already be linked to another product"),
  });

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Set Price" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Set Price" }]} />
        <Typography variant="caption" color="text.secondary">
          Set the selling price for products already purchased and in stock — separate from purchase cost. POS Checkout charges this price.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Autocomplete
              options={results ?? []}
              getOptionLabel={(p: any) => p.description ?? p.stock_id ?? ""}
              inputValue={search}
              onInputChange={(_, v) => setSearch(v)}
              onChange={(_, v) => v && selectProduct(v)}
              filterOptions={(x) => x}
              renderOption={(props, option: any) => (
                <li {...props} key={option.stock_id}>
                  <Stack>
                    <Typography variant="body2">{option.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.stock_id} {option.barcode ? `· Barcode: ${option.barcode}` : ""}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="Find Product"
                  placeholder="Search or scan barcode — type name, stock ID, or barcode"
                  size="small"
                />
              )}
            />

            {product && (
              <>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{product.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.stock_id} {product.barcode ? `· Barcode: ${product.barcode}` : "· No barcode linked"}
                    </Typography>
                  </Box>
                  <Chip label={`Stock on hand: ${product.quantity}`} />
                </Stack>

                {!product.barcode && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <TextField
                      label="Link Barcode" size="small" fullWidth
                      placeholder="Scan the packet's barcode, or type it"
                      value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)}
                      helperText="This product has no barcode on file yet — link the real one printed on it"
                    />
                    <Button
                      variant="outlined" sx={{ whiteSpace: "nowrap" }}
                      disabled={!newBarcode.trim() || linkBarcodeMutation.isPending}
                      onClick={() => linkBarcodeMutation.mutate()}
                    >
                      {linkBarcodeMutation.isPending ? "Linking..." : "Link Barcode"}
                    </Button>
                  </Stack>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Purchase Cost" size="small" sx={{ flex: 1 }}
                    value={formatCurrency(cost)} disabled
                  />
                  <TextField
                    label="Profit Margin" type="number" size="small" sx={{ flex: 1 }}
                    value={margin}
                    onChange={(e) => { setLastEdited("margin"); setMargin(e.target.value); }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                  <TextField
                    label="Selling Price" type="number" size="small" sx={{ flex: 1 }}
                    value={sellingPrice}
                    onChange={(e) => { setLastEdited("price"); setSellingPrice(e.target.value); }}
                  />
                </Stack>

                {currentPricing && (
                  <Typography variant="caption" color="text.secondary">
                    Current selling price on file: {formatCurrency(currentPricing.price)}
                  </Typography>
                )}

                <Button
                  variant="contained" size="large" startIcon={<PriceChangeIcon />}
                  disabled={!sellingPrice || Number(sellingPrice) <= 0 || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {saveMutation.isPending ? "Saving..." : "Save Selling Price"}
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
