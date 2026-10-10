import React, { useEffect, useState } from "react";
import { TextField, TextFieldProps } from "@mui/material";

export interface FormattedNumberFieldProps
  extends Omit<TextFieldProps, "type"> {
  value?: number | string | undefined | null;
  /** Force this many decimal places when not focused (opt-in — default keeps existing behavior). */
  fixedDecimals?: number;
}

function formatWithCommas(raw: string): string {
  if (raw === "" || raw === "-") return raw;
  const [intPart, decPart] = raw.split(".");
  const negative = intPart.startsWith("-");
  const digits = intPart.replace("-", "");
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "-" : "") + withCommas + (decPart !== undefined ? "." + decPart : "");
}

/**
 * Number input that shows thousand separators while not focused, and plain
 * digits while typing (avoids cursor-jump issues with live comma insertion).
 */
export default function FormattedNumberField({
  value,
  onChange,
  onFocus,
  onBlur,
  fixedDecimals,
  ...rest
}: FormattedNumberFieldProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // With fixedDecimals, don't force "X.00" while the user is still typing —
    // that would snap every keystroke back and block entering more digits.
    if (fixedDecimals !== undefined && isFocused) return;

    if (value === "" || value === null || value === undefined) {
      setText("");
      return;
    }
    const num = Number(value);
    const raw = fixedDecimals !== undefined && Number.isFinite(num)
      ? num.toFixed(fixedDecimals)
      : String(value);
    setText(formatWithCommas(raw));
  }, [value, fixedDecimals, isFocused]);

  return (
    <TextField
      {...rest}
      error={!!rest.error}
      helperText={typeof rest.error === 'string' ? rest.error : rest.helperText}
      value={text}
      inputMode="decimal"
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        const raw = text.replace(/,/g, "");
        const num = Number(raw);
        const formatted = fixedDecimals !== undefined && Number.isFinite(num)
          ? num.toFixed(fixedDecimals)
          : String(num);
        setText(Number.isFinite(num) ? formatWithCommas(formatted) : "");
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, "");
        // Only allow valid number inputs (including negative sign and decimal)
        if (!/^-?\d*\.?\d*$/.test(raw)) return;
        
        setText(formatWithCommas(raw));
        
        if (onChange) {
            // Create a synthetic event that looks like standard onChange but holds the raw unformatted string value
            // Note: e.target properties are not enumerable so they must be explicitly copied
            const fakeEvent = {
                ...e,
                target: {
                    ...e.target,
                    name: e.target.name,
                    value: raw
                }
            };
            onChange(fakeEvent as any);
        }
      }}
    />
  );
}
