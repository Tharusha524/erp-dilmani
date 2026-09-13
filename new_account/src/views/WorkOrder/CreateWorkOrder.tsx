import React from "react";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import WorkOrderListTable from "./WorkOrderListTable";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getWorkOrderButtonAssignments,
  WorkOrderButtonKey,
} from "../../api/WorkOrder/workOrderButtonAssignmentsApi";

const WORK_TYPES = ["Factory", "Printing", "Embroidery"] as const;
type WorkType = (typeof WORK_TYPES)[number];

const workTypeFromPath = (pathname: string): WorkType => {
  const segment = pathname.split("/").pop()?.toLowerCase();
  if (segment === "printing") return "Printing";
  if (segment === "embroidery") return "Embroidery";
  return "Factory";
};

const departmentSuffix = (workType: WorkType): "factory" | "printing" | "embroidery" => {
  if (workType === "Printing") return "printing";
  if (workType === "Embroidery") return "embroidery";
  return "factory";
};

export default function CreateWorkOrder() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const workType = workTypeFromPath(pathname);
  const { user } = useAuth();

  const { data: buttonAssignments = [] } = useQuery({
    queryKey: ["wo-sheet-button-assignments"],
    queryFn: getWorkOrderButtonAssignments,
  });

  // Mirrors the backend's authorizeButtonAction: Admins may always create;
  // otherwise a button with no assignments is open to everyone, and one
  // with assignments is restricted to those assigned users.
  const canCreate = (): boolean => {
    if (user && (user.role || "").toLowerCase() === "admin") return true;
    const key = `create_${departmentSuffix(workType)}` as WorkOrderButtonKey;
    const assignedIds = buttonAssignments.filter((a) => a.button_key === key).map((a) => a.user_id);
    if (assignedIds.length === 0) return true;
    return !!user && assignedIds.includes(user.id);
  };
  const allowed = canCreate();

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h5" fontWeight={700}>
            Create Work Order — {workType}
          </Typography>
          <Tooltip title={allowed ? "" : "You're not authorized to create a work order for this department"}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!allowed}
                onClick={() => {
                  if (workType === "Printing") navigate("/workorder/create/printing/add-work-order");
                  else if (workType === "Embroidery") navigate("/workorder/create/embroidery/add-work-order");
                  else navigate(`/workorder/create/add-work-order?department=${workType}`);
                }}
              >
                Add Work Order
              </Button>
            </span>
          </Tooltip>
        </Stack>
        <WorkOrderListTable department={workType} />
      </Box>
    </FormPageLayout>
  );
}
