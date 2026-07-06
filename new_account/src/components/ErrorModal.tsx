// components/ErrorModal.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function ErrorModal({ open, onClose, message }: ErrorModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <ErrorOutlineIcon color="error" />
          <Typography variant="h6">Error</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="error" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
