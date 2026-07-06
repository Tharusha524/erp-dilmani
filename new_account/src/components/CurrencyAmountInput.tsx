import React, { useEffect, useState } from "react";
import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { formatTransactionAmount } from "../utils/transactionMoney";

function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === ".") {
    return 0;
  }
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export interface CurrencyAmountInputProps
  extends Omit<TextFieldProps, "value" | "onChange" | "type"> {
  value: number;
  currencyCode?: string | null;
  onChange: (value: number) => void;
  decimals?: number;
}

/** Editable amount with currency prefix; formats with commas on blur. */
export default function CurrencyAmountInput({
  value,
  currencyCode,
  onChange,
  decimals = 2,
  size = "small",
  disabled,
  ...rest
}: CurrencyAmountInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!focused) {
      setDraft("");
    }
  }, [value, focused]);

  const code = String(currencyCode ?? "")
    .trim()
    .toUpperCase();

  const displayValue = focused
    ? draft
    : formatTransactionAmount(value, decimals);

  return (
    <TextField
      {...rest}
      size={size}
      disabled={disabled}
      value={displayValue}
      onFocus={() => {
        setFocused(true);
        setDraft(Number.isFinite(value) ? String(value) : "");
      }}
      onBlur={() => {
        setFocused(false);
        onChange(parseAmountInput(draft));
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (focused) {
          setDraft(next);
          onChange(parseAmountInput(next));
        }
      }}
      InputProps={{
        ...rest.InputProps,
        startAdornment: code ? (
          <InputAdornment position="start">{code}</InputAdornment>
        ) : (
          rest.InputProps?.startAdornment
        ),
      }}
      inputProps={{
        inputMode: "decimal",
        ...rest.inputProps,
      }}
    />
  );
}
