import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function DimensionEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Dimension Entry" },
  ];

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          padding: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="Dimension Entry" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/dimension/transactions")}
        >
          Close
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 2 }}>
          The Dimension has been added.
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/dimension/transactions/dimension-entry", { state })}
          >
            Enter a New Dimension
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/dimension/inquiriesandreports/dimension-inquiry")}
          >
            Select an Existing Dimension
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/setup/maintenance/attach-documents")}
          >
            Add an Attachment
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
