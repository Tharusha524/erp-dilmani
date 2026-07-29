import React, { useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";

type UserOption = { id: number; first_name?: string; last_name?: string };
type AssignedUser = { user_id: number; user_name: string };

interface AssignedUsersEditorProps {
  assigned: AssignedUser[];
  users: UserOption[];
  onAdd: (userId: number) => void;
  onRemove: (userId: number) => void;
}

/** Chips of everyone currently assigned + a dropdown to add another person. */
export default function AssignedUsersEditor({ assigned, users, onAdd, onRemove }: AssignedUsersEditorProps) {
  const [pendingUserId, setPendingUserId] = useState<number | "">("");

  const assignedIds = new Set(assigned.map((a) => a.user_id));
  const availableUsers = users.filter((u) => !assignedIds.has(u.id));

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {assigned.length === 0 ? (
          <Chip label="Unassigned (open to everyone)" size="small" variant="outlined" />
        ) : (
          assigned.map((a) => (
            <Chip
              key={a.user_id}
              label={a.user_name || `User #${a.user_id}`}
              size="small"
              onDelete={() => onRemove(a.user_id)}
            />
          ))
        )}
      </Stack>
      <TextField
        select
        size="small"
        fullWidth
        value={pendingUserId}
        onChange={(e) => {
          const value = e.target.value === "" ? "" : Number(e.target.value);
          if (value !== "") {
            onAdd(value);
          }
          setPendingUserId("");
        }}
      >
        <MenuItem value="">
          <em>{availableUsers.length === 0 ? "All users assigned" : "+ Add person..."}</em>
        </MenuItem>
        {availableUsers.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
