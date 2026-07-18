import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState, useEffect, useMemo } from "react";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getUsers } from "../../../../api/UserManagement/userManagement";

interface AuditTrailFormData {
  startDate: string;
  endDate: string;
  type: string;
  user: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function AuditTrailForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<AuditTrailFormData>({
    startDate: "",
    endDate: "",
    type: "no",
    user: "no",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, {
    startDate: "startDate",
    endDate: "endDate",
  });

  const [errors, setErrors] = useState<Partial<AuditTrailFormData>>({});

  // Fetch transaction types
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  // Fetch users
  const { data: usersData = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const data = await getUsers();
      return data.map((user: any) => ({
        id: user.id,
        fullName: `${user.first_name} ${user.last_name}`,
        department: user.department,
        email: user.email,
        role: user.role,
        status: user.status,
      }));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<AuditTrailFormData> = {};

    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const runReportPdf = useReportGenerate({ validate });
  const handleGenerate = () => {
    void runReportPdf(formData);
  };

  return (
    <FormPageLayout>
      <Paper
        sx={{
          p: 3,
          maxWidth: "650px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}
        >
          Audit Trail Report
        </Typography>

        <Stack spacing={2}>
          {/* Start Date */}
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            error={!!errors.startDate}
            helperText={errors.startDate}
          />

          {/* End Date */}
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            error={!!errors.endDate}
            helperText={errors.endDate}
          />

          {/* Type dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: String(e.target.value) })}
            >
              <MenuItem value="no">No Type Filter</MenuItem>
              {(transTypes as any[]).map((t: any) => (
                <MenuItem key={String(t.trans_type ?? t.id ?? t.code)} value={String(t.trans_type ?? t.id ?? t.code)}>
                  {t.description ?? t.name ?? t.label ?? String(t.trans_type ?? t.id ?? t.code)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* User dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel>User</InputLabel>
            <Select
              value={formData.user}
              label="User"
              onChange={(e) => setFormData({ ...formData, user: String(e.target.value) })}
            >
              <MenuItem value="no">No User Filter</MenuItem>
              {usersData.map((u: any) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {u.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Comments */}
          <TextField
            label="Comments"
            name="comments"
            size="small"
            fullWidth
            multiline
            minRows={3}
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          />

          {/* Orientation */}
          <TextField
            label="Orientation"
            name="orientation"
            size="small"
            fullWidth
            select
            value={formData.orientation}
            onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
          >
            <MenuItem value="Portrait">Portrait</MenuItem>
            <MenuItem value="Landscape">Landscape</MenuItem>
          </TextField>

          {/* Destination */}
          <TextField
            label="Destination"
            name="destination"
            size="small"
            fullWidth
            select
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          >
            <MenuItem value="Print">PDF/Printer</MenuItem>
            <MenuItem value="Excel">Excel</MenuItem>
          </TextField>
        </Stack>

        {/* Buttons */}
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
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </Box>
      </Paper>
    </FormPageLayout>
  );
}
