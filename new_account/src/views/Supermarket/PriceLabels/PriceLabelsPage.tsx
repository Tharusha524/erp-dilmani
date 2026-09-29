import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Typography, Stack, TextField, Button, Autocomplete, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, Grid,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import JsBarcode from "jsbarcode";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import { getItems } from "../../../api/Item/ItemApi";
import { getSalesPricingByStockId } from "../../../api/SalesPricing/SalesPricingApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";

const LKR_CURRENCY_ID = 8;
const RETAIL_SALES_TYPE_ID = 3;

type LabelLine = { product: any; qty: number };

/**
 * Print sheets of price tags/labels for packaged products — barcode, name,
 * MRP and selling price, printed N-up per product. Read-only over existing
 * product/pricing data (same Sales Pricing table Set Price writes to);
 * nothing here writes anything, so it can't touch accounting.
 */
export default function PriceLabelsPage() {
  const { formatCurrency } = useHomeCurrency();
  const [lines, setLines] = useState<LabelLine[]>([]);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [pendingQty, setPendingQty] = useState("1");

  const { data: items } = useQuery({ queryKey: ["items-all"], queryFn: getItems });

  const addLine = () => {
    if (!pendingProduct) return;
    setLines((prev) => [...prev, { product: pendingProduct, qty: Math.max(1, Number(pendingQty) || 1) }]);
    setPendingProduct(null);
    setPendingQty("1");
  };

  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handlePrint = () => window.print();

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Price Labels" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Price Labels" }]} />
        <Typography variant="caption" color="text.secondary">
          Print barcode + MRP + selling price labels for shelf/packaging — pick products and how many labels each.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2 }} className="pos-receipt-no-print">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={items ?? []}
              getOptionLabel={(i: any) => i.description ?? i.stock_id ?? ""}
              value={pendingProduct}
              onChange={(_, v) => setPendingProduct(v)}
              renderInput={(p) => <TextField {...p} label="Product" size="small" />}
            />
            <TextField
              label="Labels" type="number" size="small" sx={{ width: 100 }}
              value={pendingQty} onChange={(e) => setPendingQty(e.target.value)}
            />
            <Button variant="outlined" startIcon={<AddIcon />} disabled={!pendingProduct} onClick={addLine}>
              Add
            </Button>
          </Stack>

          {lines.length > 0 && (
            <>
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow><TableCell>Product</TableCell><TableCell align="right">Labels</TableCell><TableCell align="center">Remove</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.product.description}</TableCell>
                      <TableCell align="right">{l.qty}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeLine(i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="contained" startIcon={<PrintIcon />} sx={{ mt: 2 }} onClick={handlePrint}>
                Print Labels
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #price-label-print-area, #price-label-print-area * { visibility: visible; }
          #price-label-print-area { position: absolute; top: 0; left: 0; }
          .pos-receipt-no-print { display: none !important; }
        }
      `}</style>

      {lines.length > 0 && (
        <Box id="price-label-print-area">
          <Grid container spacing={1}>
            {lines.flatMap((l, li) =>
              Array.from({ length: l.qty }).map((_, copy) => (
                <Grid item key={`${li}-${copy}`}>
                  <PriceLabel product={l.product} formatCurrency={formatCurrency} />
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      )}
    </FormPageLayout>
  );
}

function PriceLabel({ product, formatCurrency }: { product: any; formatCurrency: (v: number) => string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  const { data: pricingRows } = useQuery({
    queryKey: ["sales-pricing", product.stock_id],
    queryFn: () => getSalesPricingByStockId(product.stock_id),
  });
  const currentPricing = (pricingRows ?? []).find(
    (p: any) => p.sales_type_id === RETAIL_SALES_TYPE_ID && p.currency_id === LKR_CURRENCY_ID
  );
  const sellingPrice = Number(currentPricing?.price) || 0;
  const barcodeValue = product.barcode || product.stock_id;

  useEffect(() => {
    if (barcodeRef.current && barcodeValue) {
      try {
        JsBarcode(barcodeRef.current, String(barcodeValue), {
          format: "CODE128",
          displayValue: false,
          height: 35,
          width: 1,
          margin: 6,
        });
      } catch {
        // Non-fatal — label still prints without a scannable barcode.
      }
    }
  }, [barcodeValue]);

  return (
    <Box
      sx={{
        width: 200, p: 1, border: "1px dashed", borderColor: "divider", borderRadius: 1,
        textAlign: "center", fontFamily: "monospace",
      }}
    >
      <Typography fontSize={12} fontWeight={700} noWrap>{product.description}</Typography>
      {product.mrp_price != null && (
        <Typography fontSize={10} color="text.secondary">MRP: {formatCurrency(product.mrp_price)}</Typography>
      )}
      <Typography fontSize={15} fontWeight={800}>{formatCurrency(sellingPrice)}</Typography>
      <Box sx={{ mt: 0.5 }}>
        <svg ref={barcodeRef} style={{ maxWidth: "100%", height: "auto" }} />
      </Box>
      <Typography fontSize={9} color="text.secondary">{barcodeValue}</Typography>
    </Box>
  );
}
