import React from "react";
import { Alert, Stack, TextField } from "@mui/material";
import type { SupplierCreditSummary } from "../api/Supplier/SupplierCreditApi";
import { formatTransactionMoney } from "../utils/transactionMoney";

export interface SupplierCreditSummaryFieldsProps {
  summary: SupplierCreditSummary | null | undefined;
  documentTotal?: number;
  isLoading?: boolean;
  size?: "small" | "medium";
  /** FA label for available credit on purchasing screens */
  currentCreditLabel?: string;
  currencyCode?: string | null;
}

function formatCreditDisplay(
  value: number | null | undefined,
  currencyCode?: string | null
): string {
  if (value === null || value === undefined) {
    return "Unlimited";
  }
  return formatTransactionMoney(value, currencyCode);
}

export default function SupplierCreditSummaryFields({
  summary,
  documentTotal = 0,
  isLoading = false,
  size = "small",
  currentCreditLabel = "Current Credit",
  currencyCode,
}: SupplierCreditSummaryFieldsProps) {
  const available =
    summary?.current_credit ?? summary?.available_credit ?? null;
  const docTotal = Number(documentTotal) || 0;
  const overLimit =
    summary?.has_credit_limit &&
    available != null &&
    docTotal > 0 &&
    docTotal > available + 0.01;

  return (
    <Stack spacing={1.5}>
      <TextField
        label="Credit Limit"
        fullWidth
        size={size}
        value={isLoading ? "…" : formatCreditDisplay(summary?.credit_limit ?? 0, currencyCode)}
        InputProps={{ readOnly: true }}
      />
      <TextField
        label="Outstanding Balance"
        fullWidth
        size={size}
        value={
          isLoading ? "…" : formatCreditDisplay(summary?.outstanding_balance ?? 0, currencyCode)
        }
        InputProps={{ readOnly: true }}
      />
      <TextField
        label={currentCreditLabel}
        fullWidth
        size={size}
        value={
          isLoading
            ? "…"
            : summary?.has_credit_limit
              ? formatCreditDisplay(available, currencyCode)
              : "Unlimited"
        }
        InputProps={{ readOnly: true }}
        error={Boolean(overLimit)}
        helperText={
          overLimit
            ? `This document (${formatCreditDisplay(docTotal, currencyCode)}) exceeds current credit.`
            : undefined
        }
      />
      {overLimit ? (
        <Alert severity="error" sx={{ py: 0.5 }}>
          Credit limit will be exceeded if you save this document.
        </Alert>
      ) : null}
    </Stack>
  );
}
