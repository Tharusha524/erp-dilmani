import React from "react";
import { Alert, Typography } from "@mui/material";
import { useGlReportMoney } from "../hooks/useGlReportMoney";

/**
 * GL inquiry reports — amounts are ledger balances in home currency (converted at posting).
 */
export default function GlHomeCurrencyNotice() {
  const { currencyCode } = useGlReportMoney();

  return (
    <Alert severity="info" variant="outlined" sx={{ mx: { xs: 0, sm: 0 }, mb: 0 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        All amounts in {currencyCode} (home currency)
      </Typography>
      <Typography variant="body2">
        Sales and purchase screens may show USD. When you <strong>post</strong> a
        document, the system uses the exchange rate for that transaction date and
        stores the result in {currencyCode} in the general ledger. This report
        shows those ledger amounts (e.g. USD 1,000 at rate 320 →{" "}
        <strong>{currencyCode} 320,000.00</strong> here). It does not convert
        again. If amounts look wrong, check Banking → Exchange Rates and
        re-post affected invoices after updating rates.
      </Typography>
    </Alert>
  );
}
