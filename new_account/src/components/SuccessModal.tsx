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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export default function SuccessModal({ open, onClose, message, title = "Success" }: SuccessModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleIcon sx={{ color: "var(--pallet-green)" }} />
          <Typography variant="h6">{title}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" sx={{ backgroundColor: "var(--pallet-green)" }} onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
