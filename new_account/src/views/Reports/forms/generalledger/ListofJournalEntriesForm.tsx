import React, { useState, useEffect } from "react";
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
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import { getTransTypes } from "../../../../api/Reflines/TransTypesApi";

interface BankStatementFormData {
  startDate: string;
  endDate: string;
  type: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function ListofJournalEntriesForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<BankStatementFormData>({
    startDate: "",
    endDate: "",
    type: "no",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, {
    startDate: "startDate",
    endDate: "endDate",
  });

  const [errors, setErrors] = useState<Partial<BankStatementFormData>>({});
  const [loading, setLoading] = useState(false);

  // Fetch transaction types
  const { data: transTypes = [] } = useQuery({
    queryKey: ["transTypes"],
    queryFn: getTransTypes,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<BankStatementFormData> = {};

    if (!formData.type || formData.type === "") newErrors.type = "Type is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const runReportPdf = useReportGenerate({ validate });
  const handleGenerate = () => {
    void runReportPdf(formData);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
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
          List of Journal Entries Report
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
            onChange={handleChange}
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
            onChange={handleChange}
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
              error={!!errors.type}
            >
              <MenuItem value="no">No Type Filter</MenuItem>
              {(transTypes as any[]).map((t: any) => (
                <MenuItem key={String(t.trans_type ?? t.id ?? t.code)} value={String(t.trans_type ?? t.id ?? t.code)}>
                  {t.description ?? t.name ?? t.label ?? String(t.trans_type ?? t.id ?? t.code)}
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
            onChange={handleChange}
          />

          {/* Orientation */}
          <TextField
            label="Orientation"
            name="orientation"
            size="small"
            fullWidth
            select
            value={formData.orientation}
            onChange={handleChange}
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
            onChange={handleChange}
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
    </Stack>
  );
}
