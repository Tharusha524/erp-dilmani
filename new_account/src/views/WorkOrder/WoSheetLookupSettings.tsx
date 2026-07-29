import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import { WorkOrderLookupItem } from "../../api/WorkOrder/workOrderLookupsApi";
import { getFriendlyApiErrorMessage } from "../../utils/apiErrorMessage";

interface WoSheetLookupSettingsProps {
  title: string;
  description: string;
  queryKey: string;
  getItems: () => Promise<WorkOrderLookupItem[]>;
  createItem: (name: string) => Promise<unknown>;
  updateItem: (id: number, name: string) => Promise<unknown>;
  deleteItem: (id: number) => Promise<unknown>;
}

export default function WoSheetLookupSettings({
  title,
  description,
  queryKey,
  getItems,
  createItem,
  updateItem,
  deleteItem,
}: WoSheetLookupSettingsProps) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: getItems });

  const [newName, setNewName] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const { mutate: add, isPending: isAdding } = useMutation({
    mutationFn: (name: string) => createItem(name),
    onSuccess: () => {
      invalidate();
      setNewName("");
      enqueueSnackbar(`${title} added`, { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const { mutate: save } = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateItem(id, name),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar(`${title} updated`, { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar(`${title} removed`, { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" }),
  });

  const draftFor = (item: WorkOrderLookupItem) => drafts[item.id] ?? item.name;

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, maxWidth: 480 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={`New ${title.toLowerCase()} name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={isAdding || !newName.trim()}
            onClick={() => add(newName.trim())}
          >
            Add
          </Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 600 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 100 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">No entries yet.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const draft = draftFor(item);
                  const isDirty = draft !== item.name;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={draft}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={!isDirty || !draft.trim()}
                            onClick={() => save({ id: item.id, name: draft.trim() })}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => remove(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </FormPageLayout>
  );
}
