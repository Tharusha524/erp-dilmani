import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider, Stack } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import JsBarcode from "jsbarcode";
import { useHomeCurrency } from "../hooks/useHomeCurrency";
import { getCompanies } from "../api/CompanySetup/CompanySetupApi";
import useCurrentUser from "../hooks/useCurrentUser";
import { resolveLogoSrc } from "../utils/logoUrl";

interface ReceiptLine {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
}

interface ReceiptPaymentLine {
  method: string;
  amount: number;
}

interface PosReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  transNo?: number | string;
  customerName?: string;
  lines: ReceiptLine[];
  total: number;
  payments?: ReceiptPaymentLine[];
  cashReceived?: number;
  paperSize?: string;
  isQuote?: boolean;
  receiptSettings?: Record<string, any>;
  shiftId?: number | string;
  couponCode?: string;
  voucherCode?: string;
}

/**
 * A print-ready receipt matching the reference POS system's layout: logo,
 * branch/business info, invoice # + cashier, an ITEM/DISC/NET/TOTAL table,
 * subtotal, bold total, a Payment Info block, customer name, a thank-you
 * footer, and a real scannable barcode of the invoice number. Uses the
 * browser's native print dialog — no PDF-generation library needed. The
 * logo always comes live from Setup → Company Setup, never a separate
 * POS-only logo field.
 */
const FONT_SIZE: Record<string, number> = { small: 11, medium: 13, large: 15 };

function renderCustomFields(fields: any[], position: string) {
  if (!fields?.length) return null;
  return fields
    .filter((f) => f.position === position && f.label)
    .map((f) => (
      <Box key={f.id} sx={{ display: "flex", justifyContent: f.align === "center" ? "center" : f.align === "right" ? "flex-end" : "flex-start", mt: 0.5 }}>
        <Typography fontSize={FONT_SIZE[f.font_size] ?? 13} fontWeight={f.weight ?? 400} sx={{ whiteSpace: "pre-wrap" }}>
          {f.label}{f.value ? `: ${f.value}` : ""}
        </Typography>
      </Box>
    ));
}

export default function PosReceiptDialog({
  open, onClose, transNo, customerName, lines, total, payments, cashReceived,
  paperSize = "80mm Thermal", isQuote = false, receiptSettings, shiftId, couponCode, voucherCode,
}: PosReceiptDialogProps) {
  const { formatCurrency } = useHomeCurrency();
  const { user } = useCurrentUser();
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Merge caller's settings over defaults so every key always exists.
  const rs = {
    show_logo: true, show_shop_name: true, show_address: true, show_phone: true,
    show_email: false, show_website: false, show_vat_number: false,
    shop_email: "", shop_website: "", shop_vat_number: "",
    show_invoice_id: true, show_cashier: true, show_date_time: true,
    show_shift_id: false, show_branch_name: false,
    show_discount_column: true, show_item_unit: false, show_offer_applied: false,
    show_payment_info: true, show_change: true, show_card_type: false, show_coupon_used: false,
    show_customer_name: true,
    show_thank_you: true, thank_you_message: "THANK YOU FOR YOUR BUSINESS!",
    show_footer: true, footer_text: "Developed by DIO Solutions",
    show_custom_note: false, custom_note: "", show_barcode: true,
    font_header: "medium", font_items: "medium", font_totals: "medium", font_footer: "small",
    weight_shop_name: 800, weight_address: 400, weight_col_headers: 700,
    weight_item_name: 700, weight_unit_price: 400, weight_qty_line: 400,
    weight_subtotal: 400, weight_total: 800, weight_payment_lines: 700,
    weight_customer: 400, weight_thank_you: 700, weight_footer: 400,
    label_invoice_id: "Invoice ID", label_cashier: "Cashier", label_shift: "Shift", label_branch: "Branch",
    label_col_item: "ITEM", label_col_disc: "DISC", label_col_net: "NET", label_col_total: "TOTAL",
    label_unit_price: "UNIT PRICE", label_subtotal: "Subtotal", label_discount: "Discount",
    label_total: "TOTAL", label_payment_info: "PAYMENT INFO",
    label_cash_received: "CASH RECEIVED", label_change: "CHANGE", label_customer: "CUSTOMER",
    label_coupon: "COUPON", label_voucher: "VOUCHER",
    ...(receiptSettings ?? {}),
  };

  const { data: companies } = useQuery({
    queryKey: ["company-setup-list"],
    queryFn: getCompanies,
    enabled: open,
  });
  const company = companies?.[0];
  const logoSrc = resolveLogoSrc(company?.company_logo_url);

  useEffect(() => {
    if (open && transNo && barcodeRef.current) {
      try {
        // A quiet zone (margin) around the bars is essential for camera-based
        // scanners to reliably locate the barcode.
        JsBarcode(barcodeRef.current, String(transNo), {
          format: "CODE128",
          displayValue: false,
          height: 45,
          width: 1.8,
          margin: 10,
        });
      } catch {
        // Invalid characters for CODE128 (rare) — leave barcode blank rather than crash the receipt.
      }
    }
  }, [open, transNo]);

  const handlePrint = () => {
    window.print();
  };

  const isThermal = paperSize.includes("80mm");
  const now = new Date();
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
  const discountTotal = Math.max(0, subtotal - total);
  const paymentLines = payments && payments.length > 0 ? payments : [{ method: "CASH", amount: total }];
  const received = cashReceived ?? total;
  const change = Math.max(0, received - total);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="pos-receipt-no-print">{isQuote ? `Quotation #${transNo}` : `Receipt — Invoice #${transNo}`}</DialogTitle>
      <DialogContent>
        <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body * { visibility: hidden; }
            #pos-receipt-print-area, #pos-receipt-print-area * { visibility: visible; }
            #pos-receipt-print-area {
              position: absolute; top: 0; left: 0;
              width: 80mm; max-width: 80mm;
              margin: 0; padding: 4mm;
              border: none;
            }
            /* Thermal print heads render thin/light text as faint or broken —
               force everything bolder and fully black (not gray) so it comes
               out crisp on paper. */
            #pos-receipt-print-area, #pos-receipt-print-area * {
              font-weight: 600 !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pos-receipt-no-print { display: none !important; }
          }
        `}</style>
        <Box
          id="pos-receipt-print-area"
          sx={{ fontFamily: "monospace", width: isThermal ? 280 : "100%", mx: "auto", p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        >
          {/* ---- Header ---- */}
          <Stack alignItems="center" spacing={0.25} sx={{ mb: 1 }}>
            {rs.show_logo && logoSrc && (
              <img src={logoSrc} alt="Company logo" style={{ maxWidth: "100%", maxHeight: 64 }} />
            )}
            {rs.show_shop_name && (
              <Typography align="center" fontWeight={rs.weight_shop_name} fontSize={FONT_SIZE[rs.font_header] + 4}>
                {company?.name || "Your Business Name"}
              </Typography>
            )}
            {rs.show_address && company?.address && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]} sx={{ lineHeight: 1.2 }}>{company.address.toUpperCase()}</Typography>
            )}
            {rs.show_phone && (company?.phone_number || company?.fax_number) && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]}>
                {[company?.phone_number, company?.fax_number].filter(Boolean).join(" · ")}
              </Typography>
            )}
            {rs.show_email && rs.shop_email && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]}>{rs.shop_email}</Typography>
            )}
            {rs.show_website && rs.shop_website && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]}>{rs.shop_website}</Typography>
            )}
            {rs.show_vat_number && rs.shop_vat_number && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]}>VAT: {rs.shop_vat_number}</Typography>
            )}
            {rs.show_date_time && (
              <Typography align="center" fontWeight={rs.weight_address} fontSize={FONT_SIZE[rs.font_header]}>{now.toLocaleDateString()} {now.toLocaleTimeString()}</Typography>
            )}
          </Stack>

          <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary" }} />
          {renderCustomFields(rs.custom_fields, "after_header")}

          {isQuote && (
            <Typography align="center" fontWeight={800} fontSize={14} sx={{ mb: 0.5 }}>PRICE QUOTATION</Typography>
          )}
          <Stack spacing={0.25} sx={{ my: 1 }}>
            {rs.show_invoice_id && (
              <Typography fontSize={FONT_SIZE[rs.font_header]}>{isQuote ? "Quotation ID" : rs.label_invoice_id}: {transNo}</Typography>
            )}
            {rs.show_cashier && (
              <Typography fontSize={FONT_SIZE[rs.font_header]}>{rs.label_cashier}: {user?.first_name || user?.email || "—"}</Typography>
            )}
            {rs.show_shift_id && shiftId && (
              <Typography fontSize={FONT_SIZE[rs.font_header]}>{rs.label_shift}: {shiftId}</Typography>
            )}
            {rs.show_branch_name && company?.name && (
              <Typography fontSize={FONT_SIZE[rs.font_header]}>{rs.label_branch}: {company.name}</Typography>
            )}
            {renderCustomFields(rs.custom_fields, "after_invoice")}
          </Stack>

          <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary" }} />

          {/* ---- Line items ---- */}
          <Box sx={{ my: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_items] - 1, fontWeight: rs.weight_col_headers }}>
              <span>{rs.label_col_item}</span>
              <Box sx={{ display: "flex", gap: 2 }}>
                {rs.show_discount_column && <span>{rs.label_col_disc}</span>}
                <span>{rs.label_col_net}</span><span>{rs.label_col_total}</span>
              </Box>
            </Box>
            {lines.map((l: any, i) => {
              const netPrice = l.unit_price * (1 - l.discount_percent / 100);
              const lineTotal = l.quantity * netPrice;
              return (
                <Box key={i} sx={{ mt: 1 }}>
                  <Typography fontSize={FONT_SIZE[rs.font_items] + 1} fontWeight={rs.weight_item_name}>{l.description}</Typography>
                  <Typography fontSize={FONT_SIZE[rs.font_items] - 1} fontWeight={rs.weight_unit_price} color="text.secondary">
                    {rs.label_unit_price} {l.unit_price.toFixed(2)}{rs.show_item_unit && l.unit_name ? ` / ${l.unit_name}` : ""}
                  </Typography>
                  {rs.show_offer_applied && l.offer_name && (
                    <Typography fontSize={FONT_SIZE[rs.font_items] - 1} color="success.main">Offer: {l.offer_name}</Typography>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_items], fontWeight: rs.weight_qty_line }}>
                    <span>{l.quantity} x{rs.show_item_unit && l.unit_name ? ` ${l.unit_name}` : ""}</span>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      {rs.show_discount_column && <span>{l.discount_percent > 0 ? `${l.discount_percent}%` : "-"}</span>}
                      <span>{netPrice.toFixed(2)}</span>
                      <span>{lineTotal.toFixed(2)}</span>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary" }} />
          {renderCustomFields(rs.custom_fields, "after_items")}

          <Stack spacing={0.25} sx={{ my: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals], fontWeight: rs.weight_subtotal }}>
              <span>{rs.label_subtotal}</span><span>{formatCurrency(subtotal)}</span>
            </Box>
            {discountTotal > 0.001 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals], fontWeight: rs.weight_subtotal }}>
                <span>{rs.label_discount}</span><span>-{formatCurrency(discountTotal)}</span>
              </Box>
            )}
          </Stack>

          <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography fontWeight={rs.weight_total} fontSize={FONT_SIZE[rs.font_totals] + 7}>{rs.label_total}</Typography>
            <Typography fontWeight={rs.weight_total} fontSize={FONT_SIZE[rs.font_totals] + 7}>{formatCurrency(total)}</Typography>
          </Box>

          {!isQuote && rs.show_payment_info && (
            <>
              <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary", mt: 1.5 }} />
              <Typography fontWeight={rs.weight_payment_lines} fontSize={FONT_SIZE[rs.font_totals]} sx={{ mt: 1.5, display: "block" }}>{rs.label_payment_info}</Typography>
              <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                {paymentLines.map((p, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals] }}>
                    <span style={{ fontWeight: rs.weight_payment_lines }}>{p.method.toUpperCase()}{rs.show_card_type && (p as any).card_type_name ? ` (${(p as any).card_type_name})` : ""}</span>
                    <Typography fontWeight={rs.weight_payment_lines} fontSize={FONT_SIZE[rs.font_totals]}>{formatCurrency(p.amount)}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals] }}>
                  <span style={{ fontWeight: rs.weight_payment_lines }}>{rs.label_cash_received}</span>
                  <Typography fontWeight={rs.weight_payment_lines} fontSize={FONT_SIZE[rs.font_totals]}>{formatCurrency(received)}</Typography>
                </Box>
                {rs.show_change && change > 0.001 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals] }}>
                    <span style={{ fontWeight: rs.weight_payment_lines }}>{rs.label_change}</span>
                    <Typography fontWeight={rs.weight_payment_lines} fontSize={FONT_SIZE[rs.font_totals]}>{formatCurrency(change)}</Typography>
                  </Box>
                )}
                {rs.show_coupon_used && couponCode && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals] }}>
                    <span style={{ fontWeight: rs.weight_payment_lines }}>{rs.label_coupon}</span><span>{couponCode}</span>
                  </Box>
                )}
                {rs.show_coupon_used && voucherCode && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: FONT_SIZE[rs.font_totals] }}>
                    <span style={{ fontWeight: rs.weight_payment_lines }}>{rs.label_voucher}</span><span>{voucherCode}</span>
                  </Box>
                )}
              </Stack>
              {renderCustomFields(rs.custom_fields, "after_payment")}
            </>
          )}

          {rs.show_customer_name && (
            <>
              <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary", mt: 1.5 }} />
              <Typography fontWeight={rs.weight_customer} fontSize={FONT_SIZE[rs.font_footer] + 2} sx={{ mt: 1.5, display: "block" }}>
                {rs.label_customer} {customerName ? customerName.toUpperCase() : "WALK-IN"}
              </Typography>
            </>
          )}

          <Divider sx={{ borderStyle: "dashed", borderBottomWidth: 1.5, borderColor: "text.primary", mt: 1.5 }} />

          {!isQuote && rs.show_thank_you && (
            <Typography align="center" fontWeight={rs.weight_thank_you} fontSize={FONT_SIZE[rs.font_footer] + 3} sx={{ mt: 2 }}>
              {rs.thank_you_message}
            </Typography>
          )}
          {rs.show_footer && (
            <Typography align="center" fontWeight={rs.weight_footer} fontSize={FONT_SIZE[rs.font_footer]} color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {rs.footer_text}
            </Typography>
          )}
          {rs.show_custom_note && rs.custom_note && (
            <Typography align="center" fontWeight={rs.weight_footer} fontSize={FONT_SIZE[rs.font_footer]} sx={{ mt: 1, display: "block" }}>
              {rs.custom_note}
            </Typography>
          )}

          {renderCustomFields(rs.custom_fields, "footer")}
          {rs.show_barcode && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <svg ref={barcodeRef} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="pos-receipt-no-print">
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print Receipt</Button>
      </DialogActions>
    </Dialog>
  );
}
