import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React from "react";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";

export default function ReceivePurchaseOrderItemsSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { location: loc, reference, date } = state || {};

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Receive Purchase Order Items" },
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
          <PageTitle title="Receive Purchase Order Items" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>

        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={() => navigate("/purchase/transactions")}
        >
          Close
        </Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 2 }}>
          Purchase Order Delivery has been processed
        </Typography>

        <Stack spacing={3} direction="column" alignItems="center">
          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/receive-purchase-order-items/view", { state })}
          >
           View this Delivery
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => {
              navigate(
                purchasesGlJournalPath({
                  reference: state?.reference,
                  date: (state?.deliveryDate ?? state?.date) as string | undefined,
                  trans_type: (state?.trans_type ?? 25) as number,
                  trans_no: (state?.trans_no ?? state?.grnBatchId) as
                    | number
                    | string
                    | undefined,
                  grnBatchId: state?.grnBatchId as number | string | undefined,
                  orderNo: (state?.orderNo ?? state?.purchaseOrderRef) as
                    | number
                    | string
                    | undefined,
                }),
                {
                  state: {
                    reference: state?.reference,
                    date: state?.deliveryDate ?? state?.date,
                    deliveryDate: state?.deliveryDate,
                    orderNo: state?.orderNo ?? state?.purchaseOrderRef,
                    purchaseOrderRef: state?.purchaseOrderRef,
                    grnBatchId: state?.grnBatchId,
                    trans_no: state?.trans_no ?? state?.grnBatchId,
                    trans_type: state?.trans_type ?? 25,
                  },
                }
              );
            }}
          >
          View the GL Journal Entries for this Delivery
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() =>
              navigate("/purchase/transactions/supplier-invoice", {
                state: {
                  supplierId: state?.supplierId,
                  grnBatchId: state?.grnBatchId,
                  trans_no: state?.trans_no ?? state?.grnBatchId,
                  trans_type: 25,
                  suppliersReference: state?.suppliersReference,
                  deliveryDate: state?.deliveryDate ?? state?.date,
                  purchaseOrderRef: state?.purchaseOrderRef ?? state?.orderNo,
                  orderNo: state?.orderNo ?? state?.purchaseOrderRef,
                  reference: state?.reference,
                  deliverIntoLocation: state?.deliverIntoLocation,
                  deliveryAddress: state?.deliveryAddress,
                },
              })
            }
          >
            Entry purchase invoice for this receival
          </Button>

          <Button
            variant="outlined"
            sx={{ width: '500px' }}
            onClick={() => navigate("/purchase/transactions/outstanding-purchase-orders-maintenance", { state })}
          >
           Select a different purchase order for receiving items against
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
    </FormPageLayout>
  );
}
