import React from "react";
import { Stack } from "@mui/material";
import DimensionSelect from "./DimensionSelect";
import { useCompanySetupSettings } from "../hooks/useCompanySetupSettings";

interface ReportDimensionSelectProps {
  value: string;
  onChange: (value: string) => void;
  dimension2Value?: string;
  onDimension2Change?: (value: string) => void;
}

/** Dimension filter(s) for report PDF forms — FA dim1 / dim2 when enabled. */
export default function ReportDimensionSelect({
  value,
  onChange,
  dimension2Value = "",
  onDimension2Change,
}: ReportDimensionSelectProps) {
  const { useDimensions, dimensionLevel } = useCompanySetupSettings();

  if (!useDimensions) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <DimensionSelect
        value={value}
        onChange={onChange}
        allowEmpty
        emptyLabel="No dimension filter"
        label="Dimension"
        dimensionType={1}
      />
      {dimensionLevel >= 2 && onDimension2Change && (
        <DimensionSelect
          value={dimension2Value}
          onChange={onDimension2Change}
          allowEmpty
          emptyLabel="No dimension 2 filter"
          label="Dimension 2"
          dimensionType={2}
        />
      )}
    </Stack>
  );
}
