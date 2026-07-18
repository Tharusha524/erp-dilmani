import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

/** Period-end closing uses GL journal entries (FrontAccounting: manual closing journals). */
export default function ClosingGlTransactions() {
  const navigate = useNavigate();

  return (
    <FormPageLayout>
      <PageTitle title="Closing GL Transactions" />
      <Breadcrumb
        breadcrumbs={[
          { title: "Banking & GL", href: "/bankingandgeneralledger" },
          { title: "Maintenance", href: "/bankingandgeneralledger/maintenance" },
          { title: "Closing GL" },
        ]}
      />
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography variant="body1" paragraph>
          In FrontAccounting, year-end and period closing are done with balanced journal entries
          that transfer income and expense balances to retained earnings. Use Journal Entry to post
          closing entries, then run Trial Balance and Profit &amp; Loss to verify.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            onClick={() =>
              navigate("/bankingandgeneralledger/transactions/journal-entry")
            }
          >
            Open Journal Entry
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              navigate("/bankingandgeneralledger/inquiries-and-reports/trial-balance")
            }
          >
            Trial Balance
          </Button>
          <Button variant="text" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Paper>
    </FormPageLayout>
  );
}
