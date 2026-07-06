import React from "react";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import { useDimensions, dimensionLabel } from "../hooks/useDimensions";

export interface DimensionSelectProps extends Omit<TextFieldProps, "onChange" | "value" | "select"> {
  value: string | number;
  onChange: (value: string) => void;
  dimensionType?: 1 | 2;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export default function DimensionSelect({
  value,
  onChange,
  dimensionType,
  allowEmpty = true,
  emptyLabel = "None",
  label = "Dimension",
  size = "small",
  fullWidth = true,
  ...rest
}: DimensionSelectProps) {
  const { data: dimensions = [], isLoading } = useDimensions(dimensionType);

  return (
    <TextField
      select
      label={label}
      size={size}
      fullWidth={fullWidth}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {allowEmpty && (
        <MenuItem value="">
          <em>{emptyLabel}</em>
        </MenuItem>
      )}
      {dimensions.map((d) => (
        <MenuItem key={d.id} value={String(d.id)}>
          {dimensionLabel(d)}
        </MenuItem>
      ))}
    </TextField>
  );
}
