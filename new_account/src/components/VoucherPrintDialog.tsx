import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import JsBarcode from "jsbarcode";
import { useHomeCurrency } from "../hooks/useHomeCurrency";
import { getCompanies } from "../api/CompanySetup/CompanySetupApi";
import { resolveLogoSrc } from "../utils/logoUrl";

interface VoucherPrintDialogProps {
  open: boolean;
  onClose: () => void;
  voucher: {
    voucher_code: string;
    face_value: number | string;
    balance: number | string;
    issue_date: string;
    expiry_date?: string | null;
    debtor?: { name?: string } | null;
  } | null;
}

/**
 * A print-ready gift card — landscape card with a gold gradient, ribbon
 * accent, and guilloche-style decorative pattern, matching how a real
 * in-store gift voucher looks (not a receipt). Value is the focal point;
 * voucher number, dates, and a scannable barcode sit on a light panel at
 * the bottom for contrast. Uses the same window.print() pattern as
 * PosReceiptDialog. Logo comes live from Setup → Company Setup.
 */
export default function VoucherPrintDialog({ open, onClose, voucher }: VoucherPrintDialogProps) {
  const { formatCurrency } = useHomeCurrency();
  const [barcodeSrc, setBarcodeSrc] = useState<string | null>(null);

  const { data: companies } = useQuery({
    queryKey: ["company-setup-list"],
    queryFn: getCompanies,
    enabled: open,
  });
  const company = companies?.[0];
  const logoSrc = resolveLogoSrc(company?.company_logo_url);

  useEffect(() => {
    if (open && voucher?.voucher_code) {
      try {
        // Rendered onto an off-DOM canvas and embedded as a plain <img>
        // rather than mutating a live <svg> node — a couple of print
        // paths (this app's print pipeline included) snapshot the page
        // before that kind of imperative DOM mutation lands, which left
        // the barcode blank even though it drew fine on screen. A data
        // URL image is just page content, so it always prints.
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, voucher.voucher_code, {
          format: "CODE128",
          displayValue: false,
          height: 40,
          width: 1.8,
          margin: 6,
        });
        setBarcodeSrc(canvas.toDataURL("image/png"));
      } catch {
        // Invalid characters for CODE128 (shouldn't happen — codes are our own GV-xxxxx format).
        setBarcodeSrc(null);
      }
    } else {
      setBarcodeSrc(null);
    }
  }, [open, voucher?.voucher_code]);

  if (!voucher) return null;

  const handlePrint = () => window.print();
  const isPartlyUsed = Number(voucher.balance) < Number(voucher.face_value);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="voucher-print-no-print">Gift Voucher — {voucher.voucher_code}</DialogTitle>
      <DialogContent sx={{ display: "flex", justifyContent: "center", bgcolor: "action.hover", py: 4 }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #voucher-print-area, #voucher-print-area * { visibility: visible; }
            #voucher-print-area { position: absolute; top: 0; left: 0; width: 100%; }
            .voucher-print-no-print { display: none !important; }
          }
        `}</style>

        {/* The card itself */}
        <Box
          id="voucher-print-area"
          sx={{
            position: "relative",
            width: 480,
            maxWidth: "100%",
            aspectRatio: "1.9 / 1",
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(135deg, #7a5a19 0%, #d4af5a 28%, #f3dfa0 50%, #c99a3e 72%, #7a5a19 100%)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.45)",
            color: "#3a2a08",
          }}
        >
          {/* Guilloche-style decorative pattern overlay */}
          <Box
            sx={{
              position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "multiply",
              backgroundImage:
                "radial-gradient(circle at 20% 30%, transparent 0 18px, #5c4212 19px, transparent 20px)," +
                "radial-gradient(circle at 60% 70%, transparent 0 24px, #5c4212 25px, transparent 26px)," +
                "radial-gradient(circle at 85% 20%, transparent 0 14px, #5c4212 15px, transparent 16px)",
              backgroundSize: "90px 90px, 130px 130px, 70px 70px",
            }}
          />

          {/* Ribbon */}
          <Box sx={{ position: "absolute", top: 0, bottom: 0, left: 28, width: 26, background: "linear-gradient(90deg, #7a0e14, #b21c22 45%, #7a0e14)", boxShadow: "0 0 6px rgba(0,0,0,0.3)" }} />
          <Box
            sx={{
              position: "absolute", top: "50%", left: 41, transform: "translate(-50%, -50%)",
              width: 54, height: 54, borderRadius: "50%",
              background: "radial-gradient(circle, #d4af5a 0%, #b21c22 55%, #7a0e14 100%)",
              border: "3px solid #f3dfa0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          />

          {/* Logo corner box */}
          <Box
            sx={{
              position: "absolute", top: 14, right: 14, bgcolor: "rgba(255,252,240,0.92)",
              borderRadius: 1.5, px: 1.5, py: 0.75, boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              maxWidth: 130, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" style={{ maxWidth: "100%", maxHeight: 32, display: "block" }} />
            ) : (
              <Typography fontWeight={800} fontSize={13} color="#3a2a08">{company?.name || "Your Store"}</Typography>
            )}
          </Box>

          {/* Main content */}
          <Box sx={{ position: "relative", height: "100%", pl: "82px", pr: 2.5, pt: 2, pb: 1.25, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 22, letterSpacing: 1, textShadow: "0 1px 1px rgba(255,255,255,0.4)" }}>
                GIFT VOUCHER
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.25, fontStyle: "italic", opacity: 0.85 }}>
                A special gift, just for you
              </Typography>

              <Typography sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, fontSize: 44, lineHeight: 1.1, mt: 1, textShadow: "0 1px 2px rgba(255,255,255,0.35)" }}>
                {formatCurrency(Number(voucher.face_value))}
              </Typography>
              {isPartlyUsed && (
                <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
                  Remaining balance: {formatCurrency(Number(voucher.balance))}
                </Typography>
              )}
              {voucher.debtor?.name && (
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  Issued to: <strong>{voucher.debtor.name}</strong>
                </Typography>
              )}
            </Box>

            {/* Bottom light panel: barcode on its own row so it renders full-size
                and stays scannable, then code + dates below it. */}
            <Box
              sx={{
                bgcolor: "rgba(255,252,240,0.92)", borderRadius: 1.5, px: 1.5, py: 1,
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              <Box sx={{ textAlign: "center", minHeight: 40 }}>
                {barcodeSrc && (
                  <img src={barcodeSrc} alt={`Barcode ${voucher.voucher_code}`} style={{ maxWidth: "100%", height: 40 }} />
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  {voucher.voucher_code}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5, whiteSpace: "nowrap" }}>
                  Issued {String(voucher.issue_date).slice(0, 10)}
                  {voucher.expiry_date ? ` · Expires ${String(voucher.expiry_date).slice(0, 10)}` : " · No expiry"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Box sx={{ px: 3, pb: 1 }} className="voucher-print-no-print">
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
          <strong>Terms & Conditions:</strong> Redeemable in-store only for merchandise. Not exchangeable for cash.
          Present this voucher (or its number) at checkout. Lost or stolen vouchers cannot be replaced.
          {voucher.expiry_date ? ` Valid until ${String(voucher.expiry_date).slice(0, 10)}.` : ""}
        </Typography>
      </Box>

      <DialogActions className="voucher-print-no-print">
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print Voucher</Button>
      </DialogActions>
    </Dialog>
  );
}
