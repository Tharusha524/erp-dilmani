import React, { useMemo } from "react";
import { Box, Stack, Typography, Paper } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
  assignWorkOrderButtonUser,
  getWorkOrderButtonAssignments,
  unassignWorkOrderButtonUser,
  WorkOrderButtonKey,
} from "../../api/WorkOrder/workOrderButtonAssignmentsApi";
import { getUsers } from "../../api/UserManagement/userManagement";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import AssignedUsersEditor from "./AssignedUsersEditor";

type UserOption = { id: number; first_name?: string; last_name?: string };

const BUTTONS: { key: WorkOrderButtonKey; label: string; description: string }[] = [
  { key: "finish", label: "Finish", description: "Who can click Finish to close out a work order." },
  { key: "verify", label: "Verify", description: "Who can click Verify (unlocks Hand Over)." },
  { key: "hand_over", label: "Hand Over", description: "Who can click Hand Over to mark the order as completed." },
  { key: "reopen", label: "Re-Open", description: "Who can click Re-Open to reopen a finished work order." },
];

const DEPARTMENTS: { suffix: "factory" | "printing" | "embroidery"; label: string }[] = [
  { suffix: "factory", label: "Factory" },
  { suffix: "printing", label: "Printing" },
  { suffix: "embroidery", label: "Embroidery" },
];

const SHEET_ACTIONS: { prefix: "create" | "edit" | "print" | "delete"; label: string; description: string }[] = [
  { prefix: "create", label: "Create Work Order", description: "Who can create a new order sheet." },
  { prefix: "edit", label: "Edit / Update Work Order", description: "Who can edit and update an existing order sheet." },
  { prefix: "print", label: "Print Work Order", description: "Who can print an order sheet." },
  { prefix: "delete", label: "Delete Work Order", description: "Who can delete an order sheet." },
];

export default function WorkOrderButtonSettings() {
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["wo-sheet-button-assignments"],
    queryFn: getWorkOrderButtonAssignments,
  });
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["user-managements"],
    queryFn: getUsers,
  });

  const assignedUsersByButton = useMemo(() => {
    const map: Record<string, { user_id: number; user_name: string }[]> = {};
    assignments.forEach((a) => {
      if (!map[a.button_key]) map[a.button_key] = [];
      map[a.button_key].push({ user_id: a.user_id, user_name: a.user_name });
    });
    return map;
  }, [assignments]);

  const invalidateAssignments = () => {
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-button-assignments"] });
  };

  const { mutate: addAssignedUser } = useMutation({
    mutationFn: ({ buttonKey, userId }: { buttonKey: WorkOrderButtonKey; userId: number }) =>
      assignWorkOrderButtonUser(buttonKey, userId),
    onSuccess: () => {
      invalidateAssignments();
      enqueueSnackbar("Person assigned", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to assign person", { variant: "error" }),
  });

  const { mutate: removeAssignedUser } = useMutation({
    mutationFn: ({ buttonKey, userId }: { buttonKey: WorkOrderButtonKey; userId: number }) =>
      unassignWorkOrderButtonUser(buttonKey, userId),
    onSuccess: () => {
      invalidateAssignments();
      enqueueSnackbar("Person removed", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to remove person", { variant: "error" }),
  });

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Button Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Restrict who is authorized to click Finish, Verify, and Re-Open on a work order (leave unassigned
          to keep it open to everyone). Next Status is controlled in Status Setting instead.
        </Typography>

        <Stack spacing={2}>
          {BUTTONS.map((b) => (
            <Paper key={b.key} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={700}>{b.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {b.description}
              </Typography>
              <Box sx={{ maxWidth: 420 }}>
                <AssignedUsersEditor
                  assigned={assignedUsersByButton[b.key] || []}
                  users={users}
                  onAdd={(userId) => addAssignedUser({ buttonKey: b.key, userId })}
                  onRemove={(userId) => removeAssignedUser({ buttonKey: b.key, userId })}
                />
              </Box>
            </Paper>
          ))}
        </Stack>

        <Typography variant="h5" fontWeight={700} sx={{ mt: 4 }} gutterBottom>
          Work Order Sheet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Restrict who can create, edit, print, and delete order sheets — separately for Factory, Printing, and
          Embroidery (leave unassigned to keep it open to everyone).
        </Typography>

        <Stack spacing={3}>
          {DEPARTMENTS.map((dept) => (
            <Paper key={dept.suffix} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                {dept.label}
              </Typography>
              <Stack spacing={2}>
                {SHEET_ACTIONS.map((action) => {
                  const key = `${action.prefix}_${dept.suffix}` as WorkOrderButtonKey;
                  return (
                    <Box key={key}>
                      <Typography variant="body2" fontWeight={600}>
                        {action.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        {action.description}
                      </Typography>
                      <Box sx={{ maxWidth: 420 }}>
                        <AssignedUsersEditor
                          assigned={assignedUsersByButton[key] || []}
                          users={users}
                          onAdd={(userId) => addAssignedUser({ buttonKey: key, userId })}
                          onRemove={(userId) => removeAssignedUser({ buttonKey: key, userId })}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </FormPageLayout>
  );
}
