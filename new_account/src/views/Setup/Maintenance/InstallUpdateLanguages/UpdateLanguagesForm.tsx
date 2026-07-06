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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { updateAppLanguage } from "../../../../api/Setup/AppSetupApi";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ErrorModal from "../../../../components/ErrorModal";
import SuccessModal from "../../../../components/SuccessModal";

interface UpdateLanguagesData {
  languageId: string;
  languageCode: string;
  languageName: string;
  encoding: string;
  rtl: boolean;
  defaultLanguage: boolean;
  poFile: File | null;
  moFile: File | null;
}

export default function UpdateLanguagesForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<UpdateLanguagesData>({
    languageId: "",
    languageCode: "",
    languageName: "",
    encoding: "",
    rtl: false,
    defaultLanguage: false,
    poFile: null,
    moFile: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateLanguagesData, string>>>({});

  const handleChange = (field: keyof UpdateLanguagesData, value: any) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const handleFileChange = (field: "poFile" | "moFile", e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleChange(field, e.target.files[0]);
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof UpdateLanguagesData, string>> = {};
    if (!formData.languageId.trim()) newErrors.languageId = "Language ID is required";
    if (!formData.languageCode.trim()) newErrors.languageCode = "Language code is required";
    if (!formData.languageName.trim()) newErrors.languageName = "Language name is required";
    if (!formData.encoding.trim()) newErrors.encoding = "Encoding is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        await updateAppLanguage(Number(formData.languageId), {
          code: formData.languageCode,
          name: formData.languageName,
        });
        queryClient.invalidateQueries({ queryKey: ["appLanguages"] });
        setOpen(true);
      } catch (error: any) {
        setErrorMessage(
          error?.message ||
          error?.response?.data?.message ||
          "Failed to update language. Please try again."
        );
        setErrorOpen(true);
        console.error("Error updating language:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper sx={{ p: 3, maxWidth: "600px", width: "100%", boxShadow: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}>
          Update Language
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Language ID"
            size="small"
            fullWidth
            value={formData.languageId}
            onChange={(e) => handleChange("languageId", e.target.value)}
            error={!!errors.languageId}
            helperText={errors.languageId || " "}
          />

          <TextField
            label="Language Code"
            size="small"
            fullWidth
            value={formData.languageCode}
            onChange={(e) => handleChange("languageCode", e.target.value)}
            error={!!errors.languageCode}
            helperText={errors.languageCode || " "}
          />

          <TextField
            label="Language Name"
            size="small"
            fullWidth
            value={formData.languageName}
            onChange={(e) => handleChange("languageName", e.target.value)}
            error={!!errors.languageName}
            helperText={errors.languageName || " "}
          />

          <TextField
            label="Encoding"
            size="small"
            fullWidth
            value={formData.encoding}
            onChange={(e) => handleChange("encoding", e.target.value)}
            error={!!errors.encoding}
            helperText={errors.encoding || " "}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.rtl}
                onChange={(e) => handleChange("rtl", e.target.checked)}
              />
            }
            label="Right to Left"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.defaultLanguage}
                onChange={(e) => handleChange("defaultLanguage", e.target.checked)}
              />
            }
            label="Default Language"
          />

          {/* PO File */}
          <Button variant="outlined" component="label">
            Choose Language File (PO)
            <input
              type="file"
              hidden
              onChange={(e) => handleFileChange("poFile", e)}
              accept=".po"
            />
          </Button>
          {formData.poFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {formData.poFile.name}
            </Typography>
          )}
          {errors.poFile && (
            <Typography variant="body2" color="error">
              {errors.poFile}
            </Typography>
          )}

          {/* MO File */}
          <Button variant="outlined" component="label">
            Choose Language File (MO)
            <input
              type="file"
              hidden
              onChange={(e) => handleFileChange("moFile", e)}
              accept=".mo"
            />
          </Button>
          {formData.moFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {formData.moFile.name}
            </Typography>
          )}
          {errors.moFile && (
            <Typography variant="body2" color="error">
              {errors.moFile}
            </Typography>
          )}
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 0,
          }}
        >
          <Button onClick={() => window.history.back()}>Back</Button>

          <Button
            variant="contained"
            fullWidth={isMobile}
            disabled={isLoading}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </Box>
      </Paper>

      {/* Success Modal */}
      <SuccessModal
        open={open}
        onClose={() => {
          setOpen(false);
          navigate(-1);
        }}
        message="Language updated successfully!"
      />

      {/* Error Modal */}
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}
