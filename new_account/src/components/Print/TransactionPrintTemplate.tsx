import type { ReactNode } from "react";
import {
  Box,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CompanyDocumentHeader from "../CompanyDocumentHeader";
import { formatPrintDate, formatPrintMoney } from "../../utils/formatPrintDocument";
import type { TransactionPrintTemplateProps } from "../../types/transactionPrint";

export default function TransactionPrintTemplate({
  documentType,
  documentNumber,
  reference,
  documentDate,
  dueDate,
  currency,
  partyLabel = "Bill To",
  partyName,
  partyLines = [],
  partyFields = [],
  documentFields = [],
  columns,
  lines,
  totals,
  comments,
  footerNote,
}: TransactionPrintTemplateProps) {
  const docTitle = documentNumber != null && documentNumber !== ""
    ? `${documentType} #${documentNumber}`
    : documentType;

  return (
    <Box className="transaction-print-template" sx={{ color: "#1a1a2e", fontSize: "0.8125rem" }}>
      <Box
        className="transaction-print-accent-bar"
        sx={{ height: 2, bgcolor: "#024271", borderRadius: 0.25, mb: 1 }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CompanyDocumentHeader compact />
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0, pl: 1 }}>
          <Box
            className="transaction-print-doc-badge"
            sx={{
              display: "inline-block",
              bgcolor: "#024271",
              color: "#fff",
              px: 1.25,
              py: 0.35,
              borderRadius: 0.35,
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              lineHeight: 1.3,
            }}
          >
            {documentType.toUpperCase()}
          </Box>
          {documentNumber != null && documentNumber !== "" && (
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ lineHeight: 1.2, mt: 0.35, fontSize: "0.8rem" }}
            >
              #{documentNumber}
            </Typography>
          )}
          {reference && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.15 }}>
              Ref: {reference}
            </Typography>
          )}
        </Box>
      </Stack>

      <Divider sx={{ mb: 1.25 }} />

      {/* Party + document meta */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 1.5 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "#024271", fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.65rem" }}
          >
            {partyLabel}
          </Typography>
          {partyName && (
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25, fontSize: "0.85rem" }}>
              {partyName}
            </Typography>
          )}
          {partyLines.map((line, i) => (
            <Typography key={i} variant="body2" color="text.secondary" whiteSpace="pre-line">
              {line}
            </Typography>
          ))}
          {partyFields.map((f, i) => (
            <Typography key={i} variant="body2" sx={{ mt: 0.5 }}>
              <Box component="span" fontWeight={600}>
                {f.label}:
              </Box>{" "}
              {f.value}
            </Typography>
          ))}
        </Box>

        <Box
          className="transaction-print-doc-details"
          sx={{ flex: 1, maxWidth: { md: 210 }, minWidth: { md: 160 } }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#024271",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontSize: "0.58rem",
              display: "block",
              mb: 0.15,
            }}
          >
            Document Details
          </Typography>
          <Stack spacing={0.1} sx={{ mt: 0 }}>
            {documentDate && (
              <MetaRow compact label="Date" value={formatPrintDate(documentDate)} />
            )}
            {dueDate && (
              <MetaRow compact label="Due Date" value={formatPrintDate(dueDate)} />
            )}
            {currency && <MetaRow compact label="Currency" value={currency} />}
            {documentFields.map((f, i) => (
              <MetaRow compact key={i} label={f.label} value={f.value} />
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Line items */}
      <TableContainer>
        <Table
          size="small"
          className="transaction-print-table"
          sx={{
            "& th": {
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#024271",
              borderBottom: "2px solid #024271",
              py: 1,
            },
            "& td": { py: 0.85, borderColor: "#e8ecf1" },
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: "#f0f4f8" }}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align ?? "left"}
                  sx={{ width: col.width }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No line items
                </TableCell>
              </TableRow>
            ) : (
              lines.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align ?? "left"}>
                      {row[col.id] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Box sx={{ minWidth: 280, maxWidth: 340 }}>
          {totals.subtotal != null && (
            <TotalRow
              label="Subtotal"
              value={formatPrintMoney(totals.subtotal, totals.currency)}
            />
          )}
          {totals.taxLines && totals.taxLines.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5, mb: 0.25, fontStyle: "italic" }}
              >
                {totals.taxIncluded ? "Tax included" : "Tax"}
              </Typography>
              {totals.taxLines.map((tax, i) => (
                <TotalRow
                  key={i}
                  label={tax.label}
                  value={formatPrintMoney(tax.amount, totals.currency)}
                  small
                />
              ))}
            </>
          )}
          <Divider sx={{ my: 1 }} />
          <TotalRow
            label="Total"
            value={formatPrintMoney(totals.total, totals.currency)}
            bold
          />
        </Box>
      </Box>

      {comments && comments.trim() && (
        <Box sx={{ mt: 3, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e8ecf1" }}>
          <Typography variant="caption" fontWeight={700} color="#024271" display="block" mb={0.5}>
            Comments / Notes
          </Typography>
          <Typography variant="body2" whiteSpace="pre-line">
            {comments}
          </Typography>
        </Box>
      )}

      {footerNote && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3, textAlign: "center" }}
        >
          {footerNote}
        </Typography>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 4, pt: 2, borderTop: "1px solid #e8ecf1", textAlign: "center" }}
      >
        {docTitle}
        {documentDate ? ` · ${formatPrintDate(documentDate)}` : ""}
      </Typography>
    </Box>
  );
}

function MetaRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  const fontSize = compact ? "0.58rem" : "0.8125rem";

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={compact ? 0.75 : 2}
      className={compact ? "transaction-print-meta-row" : undefined}
      sx={{ lineHeight: compact ? 1.15 : 1.43, py: compact ? 0.05 : 0 }}
    >
      <Typography
        component="span"
        color="text.secondary"
        sx={{ flexShrink: 0, fontSize, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        fontWeight={500}
        textAlign="right"
        sx={{
          fontSize,
          minWidth: 0,
          wordBreak: "break-word",
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
  small = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: small ? 0.15 : 0.35 }}>
      <Typography variant={small ? "body2" : "body2"} color={bold ? "text.primary" : "text.secondary"} fontWeight={bold ? 700 : 400}>
        {label}
      </Typography>
      <Typography variant={bold ? "subtitle1" : "body2"} fontWeight={bold ? 700 : 500}>
        {value}
      </Typography>
    </Stack>
  );
}
