import React from "react";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import { useCostCenters, costCenterLabel } from "../hooks/useCostCenters";

export interface CostCenterSelectProps extends Omit<TextFieldProps, "onChange" | "value" | "select"> {
  value: string | number;
  onChange: (value: string) => void;
  costCenterType?: 1 | 2;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export default function CostCenterSelect({
  value,
  onChange,
  costCenterType,
  allowEmpty = true,
  emptyLabel = "None",
  label = "CostCenter",
  size = "small",
  fullWidth = true,
  ...rest
}: CostCenterSelectProps) {
  const { data: costCenters = [], isLoading } = useCostCenters(costCenterType);

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
      {costCenters.map((d) => (
        <MenuItem key={d.id} value={String(d.id)}>
          {costCenterLabel(d)}
        </MenuItem>
      ))}
    </TextField>
  );
}
