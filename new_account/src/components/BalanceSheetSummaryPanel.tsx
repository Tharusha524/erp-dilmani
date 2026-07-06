import React from "react";
import { Alert, Paper, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { formatSignedAccountingAmount } from "../utils/accountingDisplay";

export interface BalanceSheetSlice {
  total_assets?: number;
  long_term_liabilities?: number;
  current_liabilities?: number;
  total_liabilities?: number;
  total_equity?: number;
  liabilities_plus_equity?: number;
}

interface Props {
  title?: string;
  slice?: BalanceSheetSlice | null;
  equationBalanced?: boolean;
  equationDifference?: number;
  asAtLabel?: string;
}

function Row({ label, value, indent = false, bold = false }: { label: string; value: number; indent?: boolean; bold?: boolean }) {
  return (
    <TableRow>
      <TableCell sx={{ pl: indent ? 4 : 2, fontWeight: bold ? 700 : 400, border: 0 }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: bold ? 700 : 400, border: 0, minWidth: 140 }}>
        {formatSignedAccountingAmount(value)}
      </TableCell>
    </TableRow>
  );
}

export default function BalanceSheetSummaryPanel({
  title = "Balance Sheet Check",
  slice,
  equationBalanced,
  equationDifference = 0,
  asAtLabel,
}: Props) {
  if (!slice) return null;

  const assets = Number(slice.total_assets) || 0;
  const liabEquity = Number(slice.liabilities_plus_equity) || 0;
  const balanced = equationBalanced ?? Math.abs(assets - liabEquity) < 0.01;

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
        {asAtLabel ? ` — ${asAtLabel}` : ""}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Net signed balances (opening balance logic): Assets = Liabilities + Equity. Retained earnings loss
        (1330) reduces equity — not the trial balance grand total.
      </Typography>

      <Table size="small">
        <TableBody>
          <Row label="Total Assets" value={assets} bold />
          <TableRow>
            <TableCell colSpan={2} sx={{ fontWeight: 600, pt: 2, border: 0 }}>
              Liabilities
            </TableCell>
          </TableRow>
          <Row label="Long Term Liabilities" value={Number(slice.long_term_liabilities) || 0} indent />
          <Row label="Current Liabilities" value={Number(slice.current_liabilities) || 0} indent />
          <Row label="Total Liabilities" value={Number(slice.total_liabilities) || 0} bold />
          <TableRow>
            <TableCell colSpan={2} sx={{ fontWeight: 600, pt: 2, border: 0 }}>
              Equity
            </TableCell>
          </TableRow>
          <Row label="Total Equity (incl. Retained Earnings)" value={Number(slice.total_equity) || 0} bold />
          <Row label="Total Liabilities + Equity" value={liabEquity} bold />
        </TableBody>
      </Table>

      <Alert severity={balanced ? "success" : "warning"} sx={{ mt: 2 }}>
        {balanced
          ? `Balanced: Assets ${formatSignedAccountingAmount(assets)} = Liabilities + Equity ${formatSignedAccountingAmount(liabEquity)}`
          : `Not balanced — difference ${formatSignedAccountingAmount(equationDifference)}`}
      </Alert>
    </Paper>
  );
}
