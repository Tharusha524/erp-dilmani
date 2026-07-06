import React from "react";
import { ToggleButton, ToggleButtonGroup, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export type BankPayerMode = "gl" | "customer" | "supplier";

type BankPayerModeBarProps = {
  mode: BankPayerMode;
  onModeChange: (mode: BankPayerMode) => void;
  /** payment or deposit — affects customer/supplier navigation targets */
  entryKind?: "payment" | "deposit";
};

/**
 * FrontAccounting gl_bank.php payer selector: Misc (GL) | Customer | Supplier.
 */
export default function BankPayerModeBar({
  mode,
  onModeChange,
  entryKind = "payment",
}: BankPayerModeBarProps) {
  const navigate = useNavigate();

  const handleChange = (_: React.MouseEvent<HTMLElement>, value: BankPayerMode | null) => {
    if (!value || value === mode) return;

    if (value === "gl") {
      onModeChange("gl");
      return;
    }

    if (value === "customer") {
      navigate("/sales/transactions/customer-payments", {
        state: { fromBanking: true, entryKind },
      });
      return;
    }

    navigate("/purchase/transactions/payment-to-suppliers", {
      state: { fromBanking: true, entryKind },
    });
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        Pay to / Receive from
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        onChange={handleChange}
        aria-label="Bank payer type"
      >
        <ToggleButton value="gl">Miscellaneous (GL)</ToggleButton>
        <ToggleButton value="customer">Customer</ToggleButton>
        <ToggleButton value="supplier">Supplier</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
