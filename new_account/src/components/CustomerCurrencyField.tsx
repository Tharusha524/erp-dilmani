import React from "react";
import { TextField } from "@mui/material";
import { useHomeCurrency } from "../hooks/useHomeCurrency";
import { resolveTransactionCurrencyCode } from "../utils/relationId";

export interface CustomerCurrencyFieldProps {
  customer?: any;
  currencyCode?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

export default function CustomerCurrencyField({
  customer,
  currencyCode,
  size = "small",
  fullWidth = true,
}: CustomerCurrencyFieldProps) {
  const { code: homeCurrencyCode } = useHomeCurrency();
  const code =
    String(currencyCode ?? "")
      .trim()
      .toUpperCase() ||
    resolveTransactionCurrencyCode(customer, homeCurrencyCode);

  return (
    <TextField
      label="Currency"
      fullWidth={fullWidth}
      size={size}
      value={code}
      InputProps={{ readOnly: true }}
    />
  );
}
