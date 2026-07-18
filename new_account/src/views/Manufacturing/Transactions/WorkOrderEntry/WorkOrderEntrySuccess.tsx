import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";

export default function WorkOrderEntrySuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { reference } = state || {};
  const { type } = state || {};
  const { deleted } = state || {};
  const { successMode } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Work Order Entry" },
  ];

  return (
    <FormPageLayout>
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
          <PageTitle title="Work Order Entry" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/manufacturing/transactions")}
        >
          Close
        </Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        {deleted ? (
          <>
            <Typography sx={{ mb: 2 }}>
              The Work Order has been deleted.
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button
                variant="outlined"
                sx={{ width: '500px' }}
                onClick={() => navigate("/manufacturing/transactions/work-order-entry")}
              >
                Enter a New Work Order
              </Button>

              <Button
                variant="outlined"
                sx={{ width: '500px' }}
                onClick={() => navigate("/manufacturing/inquiriesandreports/work-order-inquiry")}
              >
                Select an Existing Work Order
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Typography sx={{ mb: 2 }}>
              {successMode === 'manufacture'
                ? 'The manufacturing process has been entered.'
                : successMode === 'release'
                ? 'The Work Order has been released.'
                : successMode === 'update'
                ? 'The Work Order has been updated.'
                : 'The Work Order has been added.'}
            </Typography>

            <Stack spacing={3} direction="column" alignItems="center">
              {successMode === 'manufacture' ? (
                // Manufacturing success: show only the required options
                (<>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view", { state })}
                  >
                    View This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view-gl-journal-entries", { state: { reference } })}
                  >
                    View the GL Journal Entries for This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                  >
                    Print the GL Journal Entries for This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/outstanding-work-orders")}
                  >
                    Select another Work Order to Process
                  </Button>
                </>)
              ) : successMode === 'update' ? (
                // Update success: show only Enter New and Select Existing (same as delete)
                (<>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry")}
                  >
                    Enter a New Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/inquiriesandreports/work-order-inquiry")}
                  >
                    Select an Existing Work Order
                  </Button>
                </>)
              ) : Number(type) === 2 ? (
                <>
                  <Button
                    variant="contained"
                    sx={{ width: "500px" }}
                    onClick={() =>
                      navigate("/manufacturing/transactions/outstanding-work-orders/release", {
                        state: { id: state?.id, reference, action: "release" },
                      })
                    }
                  >
                    Release This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: "500px" }}
                    onClick={() => navigate("/manufacturing/transactions/outstanding-work-orders")}
                  >
                    Go to Outstanding Work Orders
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: "500px" }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view", { state })}
                  >
                    View This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: "500px" }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry", { state })}
                  >
                    Enter a New Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: "500px" }}
                    onClick={() => navigate("/manufacturing/inquiriesandreports/work-order-inquiry")}
                  >
                    Work Order Inquiry
                  </Button>
                </>
              ) : successMode === 'cost' ? (
                // Cost processing success: show limited cost-related options
                (<>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view", { state })}
                  >
                    View This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view-gl-journal-entries", { state: { reference } })}
                  >
                    View the GL Journal Entries for This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/outstanding-work-orders/costs", { state: { id: state?.id } })}
                  >
                    Enter another additional cost
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/outstanding-work-orders")}
                  >
                    Select another Work Order to Process
                  </Button>
                </>)
              ) : (
                // Non-advanced: show full options
                (<>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry/view", { state })}
                  >
                    View This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() =>
                      navigate("/manufacturing/transactions/work-order-entry/view", {
                        state: { ...state, autoPrint: true },
                      })
                    }
                  >
                    Print This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => (window.location.href = "mailto:?subject=ERP%20Document")}
                  >
                    Email This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => {
                      navigate("/manufacturing/transactions/work-order-entry/view-gl-journal-entries", { state: { reference } });
                    }}
                  >
                    View the GL Journal Entries for This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() =>
                      navigate("/bankingandgeneralledger/transactions/journal-entry/view-journal-entry", {
                        state: { reference, autoPrint: true },
                      })
                    }
                  >
                    Print the GL Journal Entries for This Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/setup/maintenance/attach-documents")}
                  >
                    Add an Attachment
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/transactions/work-order-entry", { state })}
                  >
                    Enter a New Work Order
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ width: '500px' }}
                    onClick={() => navigate("/manufacturing/inquiriesandreports/work-order-inquiry")}
                  >
                    Select an Existing Work Order
                  </Button>
                </>)
              )}
            </Stack>
          </>
        )}
      </Paper>
    </FormPageLayout>
  );
}
