import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  TextField,
  CircularProgress,
  Box,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export type ConfirmDialogSeverity = "warning" | "error";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: ConfirmDialogSeverity;
  showReasonField?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  loading?: boolean;
}

const severityConfig: Record<
  ConfirmDialogSeverity,
  { icon: React.ReactNode; confirmColor: "warning" | "error" }
> = {
  warning: {
    icon: <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />,
    confirmColor: "warning",
  },
  error: {
    icon: <ErrorOutlineIcon color="error" sx={{ fontSize: 28 }} />,
    confirmColor: "error",
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  severity = "warning",
  showReasonField = false,
  reasonLabel = "Reason (optional)",
  reasonPlaceholder = "Enter a note for the audit trail…",
  reasonRequired = false,
  loading = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const config = severityConfig[severity];

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (reasonRequired && !trimmed) {
      return;
    }
    onConfirm(trimmed || undefined);
  };

  const confirmDisabled =
    loading || (reasonRequired && showReasonField && !reason.trim());

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ pt: 0.25 }}>{config.icon}</Box>
          <Box>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          {message}
        </Typography>

        {showReasonField && (
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label={reasonLabel}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            sx={{ mt: 2 }}
            required={reasonRequired}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={config.confirmColor}
          onClick={handleConfirm}
          disabled={confirmDisabled}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? "Please wait…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
