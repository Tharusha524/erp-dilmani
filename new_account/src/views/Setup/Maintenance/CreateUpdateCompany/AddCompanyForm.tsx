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
import { createCompany } from "../../../../api/CompanySetup/CompanySetupApi";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ErrorModal from "../../../../components/ErrorModal";
import SuccessModal from "../../../../components/SuccessModal";

interface AddCompanyData {
  company: string;
  defaultCompany: string;
  host: string;
  port: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbCollation: string;
  tablePref: string;
  dbScript: string;
  newScriptAdminPassword: string;
}

export default function AddCompanyForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<AddCompanyData>({
    company: "",
    defaultCompany: "",
    host: "",
    port: "",
    dbUser: "",
    dbPassword: "",
    dbName: "",
    dbCollation: "",
    tablePref: "",
    dbScript: "",
    newScriptAdminPassword: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddCompanyData, string>>>({});

  const handleChange = (field: keyof AddCompanyData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof AddCompanyData, string>> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key as keyof AddCompanyData] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value);
        });
        
        await createCompany(formDataObj);
        queryClient.invalidateQueries({ queryKey: ["companies"] });
        setOpen(true);
      } catch (error: any) {
        setErrorMessage(
          error?.message ||
          error?.response?.data?.message ||
          "Failed to add company. Please try again."
        );
        setErrorOpen(true);
        console.error("Error adding company:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper sx={{ p: 3, maxWidth: "600px", width: "100%", boxShadow: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}>
          Add Company
        </Typography>

        <Stack spacing={2}>
          {Object.keys(formData).map((field) => (
            <TextField
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              size="small"
              fullWidth
              value={formData[field as keyof AddCompanyData]}
              onChange={(e) => handleChange(field as keyof AddCompanyData, e.target.value)}
              error={!!errors[field as keyof AddCompanyData]}
              helperText={errors[field as keyof AddCompanyData]}
              type={field.toLowerCase().includes("password") ? "password" : "text"}
            />
          ))}
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
            {isLoading ? "Adding..." : "Add Company"}
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
        message="Company added successfully!"
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
