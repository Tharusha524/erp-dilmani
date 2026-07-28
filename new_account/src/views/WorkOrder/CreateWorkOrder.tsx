import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useLocation, useNavigate } from "react-router";
import WorkOrderListTable from "./WorkOrderListTable";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";

const WORK_TYPES = ["Factory", "Printing", "Embroidery"] as const;
type WorkType = (typeof WORK_TYPES)[number];

const workTypeFromPath = (pathname: string): WorkType => {
  const segment = pathname.split("/").pop()?.toLowerCase();
  if (segment === "printing") return "Printing";
  if (segment === "embroidery") return "Embroidery";
  return "Factory";
};

export default function CreateWorkOrder() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const workType = workTypeFromPath(pathname);

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h5" fontWeight={700}>
            Create Work Order — {workType}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (workType === "Printing") navigate("/workorder/create/printing/add-work-order");
              else if (workType === "Embroidery") navigate("/workorder/create/embroidery/add-work-order");
              else navigate(`/workorder/create/add-work-order?department=${workType}`);
            }}
          >
            Add Work Order
          </Button>
        </Stack>
        <WorkOrderListTable department={workType} />
      </Box>
    </FormPageLayout>
  );
}
