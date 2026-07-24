import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
  assignWorkOrderStatusUser,
  createWorkOrderStatus,
  deleteWorkOrderStatus,
  getWorkOrderStatusAssignments,
  getWorkOrderStatuses,
  unassignWorkOrderStatusUser,
  updateWorkOrderStatus,
  WorkOrderStatus,
} from "../../api/WorkOrder/workOrderStatusApi";
import { getUsers } from "../../api/UserManagement/userManagement";

const CATEGORY_OPTIONS = [
  { value: "sublimation_tshirt", label: "Sublimation T-Shirt" },
  { value: "polo_tshirt", label: "Polo T-Shirt" },
];

const PROCESS_TYPE_OPTIONS: { value: "normal" | "bulk"; label: string }[] = [
  { value: "normal", label: "Normal (≤ 200 pcs)" },
  { value: "bulk", label: "Bulk (> 200 pcs)" },
];

type UserOption = { id: number; first_name?: string; last_name?: string };

export default function WorkOrderSettings() {
  const queryClient = useQueryClient();

  const { data: statuses = [] } = useQuery({
    queryKey: ["wo-sheet-statuses"],
    queryFn: getWorkOrderStatuses,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["wo-sheet-status-assignments"],
    queryFn: getWorkOrderStatusAssignments,
  });
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["user-managements"],
    queryFn: getUsers,
  });

  const assignedUserByStatus = useMemo(() => {
    const map: Record<number, number> = {};
    assignments.forEach((a) => {
      map[a.status_id] = a.user_id;
    });
    return map;
  }, [assignments]);

  const groups = useMemo(() => {
    const map = new Map<string, WorkOrderStatus[]>();
    statuses.forEach((s) => {
      const key = `${s.category}__${s.process_type}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    for (const list of map.values()) {
      list.sort((a, b) => a.sequence_order - b.sequence_order);
    }
    return map;
  }, [statuses]);

  const invalidateStatuses = () => {
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-statuses"] });
  };
  const invalidateAssignments = () => {
    queryClient.invalidateQueries({ queryKey: ["wo-sheet-status-assignments"] });
  };

  const { mutate: saveStatus } = useMutation({
    mutationFn: ({ id, name, sequence_order }: { id: number; name: string; sequence_order: number }) =>
      updateWorkOrderStatus(id, { name, sequence_order }),
    onSuccess: () => {
      invalidateStatuses();
      enqueueSnackbar("Status updated", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to update status", { variant: "error" }),
  });

  const { mutate: removeStatus } = useMutation({
    mutationFn: (id: number) => deleteWorkOrderStatus(id),
    onSuccess: () => {
      invalidateStatuses();
      enqueueSnackbar("Status removed", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to remove status", { variant: "error" }),
  });

  const { mutate: addStatus } = useMutation({
    mutationFn: (payload: { category: string; process_type: "normal" | "bulk"; name: string; sequence_order: number }) =>
      createWorkOrderStatus(payload),
    onSuccess: () => {
      invalidateStatuses();
      enqueueSnackbar("Status added", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to add status", { variant: "error" }),
  });

  const { mutate: setAssignedUser } = useMutation({
    mutationFn: ({ statusId, userId }: { statusId: number; userId: number | "" }) =>
      userId === "" ? unassignWorkOrderStatusUser(statusId) : assignWorkOrderStatusUser(statusId, userId),
    onSuccess: () => {
      invalidateAssignments();
      enqueueSnackbar("Assignment updated", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to update assignment", { variant: "error" }),
  });

  const [drafts, setDrafts] = useState<Record<number, { name: string; sequence_order: number }>>({});
  const draftFor = (s: WorkOrderStatus) => drafts[s.id] ?? { name: s.name, sequence_order: s.sequence_order };
  const setDraft = (s: WorkOrderStatus, patch: Partial<{ name: string; sequence_order: number }>) =>
    setDrafts((prev) => ({ ...prev, [s.id]: { ...draftFor(s), ...patch } }));

  const [newStatusName, setNewStatusName] = useState<Record<string, string>>({});

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Work Order Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage the day-by-day status workflow for each garment category and process type, and assign the
        responsible user for each status.
      </Typography>

      {CATEGORY_OPTIONS.map((category) =>
        PROCESS_TYPE_OPTIONS.map((processType) => {
          const key = `${category.value}__${processType.value}`;
          const groupStatuses = groups.get(key) || [];

          return (
            <Accordion key={key} defaultExpanded={processType.value === "normal"}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>
                  {category.label} — {processType.label} ({groupStatuses.length} statuses)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", width: 80 }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Status Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold", width: 220 }}>Assigned User</TableCell>
                        <TableCell sx={{ fontWeight: "bold", width: 120 }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupStatuses.map((s) => {
                        const draft = draftFor(s);
                        const isDirty = draft.name !== s.name || draft.sequence_order !== s.sequence_order;
                        return (
                          <TableRow key={s.id}>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={draft.sequence_order}
                                onChange={(e) => setDraft(s, { sequence_order: Number(e.target.value) })}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={draft.name}
                                onChange={(e) => setDraft(s, { name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                value={assignedUserByStatus[s.id] ?? ""}
                                onChange={(e) =>
                                  setAssignedUser({
                                    statusId: s.id,
                                    userId: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                              >
                                <MenuItem value="">
                                  <em>Unassigned</em>
                                </MenuItem>
                                {users.map((u) => (
                                  <MenuItem key={u.id} value={u.id}>
                                    {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!isDirty}
                                  onClick={() =>
                                    saveStatus({ id: s.id, name: draft.name, sequence_order: draft.sequence_order })
                                  }
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => removeStatus(s.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                  <TextField
                    size="small"
                    placeholder="New status name (e.g. Day 11 step)"
                    value={newStatusName[key] || ""}
                    onChange={(e) => setNewStatusName((prev) => ({ ...prev, [key]: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    disabled={!newStatusName[key]?.trim()}
                    onClick={() => {
                      const nextSeq =
                        groupStatuses.length > 0
                          ? Math.max(...groupStatuses.map((s) => s.sequence_order)) + 1
                          : 1;
                      addStatus({
                        category: category.value,
                        process_type: processType.value,
                        name: newStatusName[key].trim(),
                        sequence_order: nextSeq,
                      });
                      setNewStatusName((prev) => ({ ...prev, [key]: "" }));
                    }}
                  >
                    Add Status
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
}
