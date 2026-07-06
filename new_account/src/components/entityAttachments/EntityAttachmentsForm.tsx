import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DatePickerComponent from "../DatePickerComponent";
import {
  createEntityAttachment,
  EntityAttachmentType,
} from "../../api/Attachments/AttachmentsApi";
import { useMessageDialog } from "../../context/MessageDialogContext";

interface EntityAttachmentsFormProps {
  entityType: EntityAttachmentType;
  entityId: string | number;
  entityIdLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EntityAttachmentsForm({
  entityType,
  entityId,
  entityIdLabel = "Entity ID",
  onSuccess,
  onCancel,
}: EntityAttachmentsFormProps) {
  const { showSuccess } = useMessageDialog();
  const [docDate, setDocDate] = useState<Date | null>(new Date());
  const [docTitle, setDocTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!docTitle.trim()) next.docTitle = "Document title is required";
    if (!docDate) next.docDate = "Document date is required";
    if (!file) next.file = "File is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("entity_type", entityType);
      data.append("entity_id", String(entityId));
      data.append("doc_title", docTitle);
      data.append("doc_date", docDate!.toISOString().slice(0, 10));
      data.append("file", file!);
      await createEntityAttachment(data);
      showSuccess("Attachment added successfully.");
      setDocTitle("");
      setFile(null);
      setDocDate(new Date());
      onSuccess?.();
    } catch {
      // Error dialog shown by API interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 2, px: isMobile ? 2 : 0 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 560 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add Attachment
        </Typography>
        <Stack spacing={2}>
          <TextField label={entityIdLabel} value={String(entityId)} size="small" fullWidth disabled />
          <DatePickerComponent
            label="Document Date"
            value={docDate}
            onChange={(date) => {
              setDocDate(date);
              setErrors((e) => ({ ...e, docDate: "" }));
            }}
            error={errors.docDate || undefined}
          />
          <TextField
            label="Document Title"
            value={docTitle}
            onChange={(e) => {
              setDocTitle(e.target.value);
              setErrors((prev) => ({ ...prev, docTitle: "" }));
            }}
            size="small"
            fullWidth
            error={!!errors.docTitle}
            helperText={errors.docTitle}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              File
            </Typography>
            <input
              type="file"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrors((prev) => ({ ...prev, file: "" }));
              }}
            />
            {errors.file && (
              <Typography variant="caption" color="error">
                {errors.file}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onCancel && (
              <Button variant="outlined" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
