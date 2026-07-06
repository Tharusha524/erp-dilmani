import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export type EmailTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
  initialTo?: string;
  initialSubject: string;
  initialBody: string;
  sending: boolean;
  shareAvailable: boolean;
  onShare?: () => void;
  onOpenGmail?: () => void;
};

export default function EmailTransactionDialog({
  open,
  onClose,
  onSend,
  initialTo = "",
  initialSubject,
  initialBody,
  sending,
  shareAvailable,
  onShare,
  onOpenGmail,
}: EmailTransactionDialogProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (open) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBody(initialBody);
    }
  }, [open, initialTo, initialSubject, initialBody]);

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Email document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Send with PDF attached sends the file automatically from the server. Open Gmail only
            opens compose — you must attach the downloaded PDF yourself.
          </Typography>
          <TextField
            label="To"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            fullWidth
            multiline
            minRows={5}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        {shareAvailable && onShare && (
          <Button onClick={onShare} disabled={sending}>
            Share (attach PDF)
          </Button>
        )}
        {onOpenGmail && (
          <Button onClick={onOpenGmail} disabled={sending} color="inherit">
            Open Gmail (manual attach)
          </Button>
        )}
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={sending || !to.trim() || !subject.trim()}
          onClick={() => void onSend(to.trim(), subject.trim(), body)}
        >
          {sending ? "Sending…" : "Send with PDF attached"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
