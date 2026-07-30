import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Box, Typography } from "@mui/material";

interface ReferenceBarcodeProps {
  value: string;
  label?: string;
}

/** Renders a scannable CODE128 barcode for a reference number (e.g. an
 * invoice reference), so it can be scanned to look up the linked record
 * elsewhere in the system. */
export default function ReferenceBarcode({ value, label = "Reference" }: ReferenceBarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 40,
      width: 1.5,
      margin: 4,
    });
  }, [value]);

  if (!value) return null;

  return (
    <Box sx={{ display: "inline-block", textAlign: "center" }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
      )}
      <svg ref={svgRef} />
    </Box>
  );
}
