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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export type MessageDialogType = "error" | "success" | "warning" | "info";

export interface MessageDialogProps {
  open: boolean;
  type?: MessageDialogType;
  title?: string;
  message: string;
  onClose: () => void;
}

const typeConfig: Record<
  MessageDialogType,
  { title: string; color: "error" | "success" | "warning" | "info"; icon: React.ReactNode }
> = {
  error: { title: "Error", color: "error", icon: <ErrorOutlineIcon color="error" /> },
  success: { title: "Success", color: "success", icon: <CheckCircleOutlineIcon color="success" /> },
  warning: { title: "Warning", color: "warning", icon: <WarningAmberIcon color="warning" /> },
  info: { title: "Information", color: "info", icon: <InfoOutlinedIcon color="info" /> },
};

export default function MessageDialog({
  open,
  type = "info",
  title,
  message,
  onClose,
}: MessageDialogProps) {
  const config = typeConfig[type];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          {config.icon}
          <Typography variant="h6">{title ?? config.title}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color={config.color} onClick={onClose}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
