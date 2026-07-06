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

interface UpdateCompanyData {
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

export default function UpdateCompanyForm() {
  const [formData, setFormData] = useState<UpdateCompanyData>({
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

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateCompanyData, string>>>({});
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const handleChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof UpdateCompanyData, string>> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) newErrors[key as keyof UpdateCompanyData] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      console.log("Company updated:", formData);
      alert("Company updated successfully!");
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper sx={{ p: 3, maxWidth: "600px", width: "100%", boxShadow: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}>
          Update Company
        </Typography>

        <Stack spacing={2}>
          {Object.keys(formData).map((field) => (
            <TextField
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              size="small"
              fullWidth
              value={formData[field as keyof UpdateCompanyData]}
              onChange={(e) => handleChange(field as keyof UpdateCompanyData, e.target.value)}
              error={!!errors[field as keyof UpdateCompanyData]}
              helperText={errors[field as keyof UpdateCompanyData]}
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
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            Update
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}
