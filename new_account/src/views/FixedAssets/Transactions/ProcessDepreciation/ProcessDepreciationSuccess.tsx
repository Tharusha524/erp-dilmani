import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";

export default function ProcessDepreciationSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference, date, total_amount, assets_count } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Process Depreciation" },
  ];

  return (
    <FormPageLayout>
      <Box
        sx={{
          p: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="Process Depreciation" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/fixedassets/transactions")}
        >
          Close
        </Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1 }}>
          Fixed assets depreciation has been processed successfully.
        </Typography>
        {reference && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Reference: {reference}
            {date ? ` · Period: ${date}` : ""}
            {total_amount != null ? ` · Total: ${Number(total_amount).toFixed(2)}` : ""}
            {assets_count != null ? ` · Assets: ${assets_count}` : ""}
          </Typography>
        )}

        <Stack spacing={2} alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: 500, maxWidth: "100%" }}
            onClick={() =>
              navigate("/fixedassets/transactions/gl-journal-entries", {
                state: { reference, date, trans_type: 0 },
              })
            }
          >
            View the GL Postings for this Depreciation
          </Button>
          <Button
            variant="outlined"
            sx={{ width: 500, maxWidth: "100%" }}
            onClick={() => navigate("/fixedassets/transactions/process-depreciation")}
          >
            Process another period
          </Button>
        </Stack>
      </Paper>
    </FormPageLayout>
  );
}
