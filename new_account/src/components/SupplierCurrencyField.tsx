import React from "react";
import { TextField } from "@mui/material";
import { useHomeCurrency } from "../hooks/useHomeCurrency";
import { resolveSupplierTransactionCurrencyCode } from "../utils/relationId";

export interface SupplierCurrencyFieldProps {
  supplier?: any;
  currencyCode?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

export default function SupplierCurrencyField({
  supplier,
  currencyCode,
  size = "small",
  fullWidth = true,
}: SupplierCurrencyFieldProps) {
  const { code: homeCurrencyCode } = useHomeCurrency();
  const code =
    String(currencyCode ?? "")
      .trim()
      .toUpperCase() ||
    resolveSupplierTransactionCurrencyCode(supplier, homeCurrencyCode);

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
