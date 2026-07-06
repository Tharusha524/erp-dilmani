import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getAccountTags } from "../../../../api/AccountTag/AccountTagsApi";
import ReportCostCenterSelect from "../../../../components/ReportCostCenterSelect";

interface BalanceSheetFormData {
  startDate: string;
  endDate: string;
  costCenter: string;
  accountTags: string;
  decimalValues: string;
  graphics: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function BalanceSheetForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<BalanceSheetFormData>({
    startDate: "",
    endDate: "",
    costCenter: "",
    accountTags: "",
    decimalValues: "no",
    graphics: "No Graphics",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, {
    startDate: "startDate",
    endDate: "endDate",
  });

  const [errors, setErrors] = useState<Partial<BalanceSheetFormData>>({});

  // Fetch account tags
  const { data: accountTags = [] } = useQuery({
    queryKey: ["accountTags"],
    queryFn: getAccountTags,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<BalanceSheetFormData> = {};

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
          Balance Sheet Report
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

          <ReportCostCenterSelect
            value={formData.costCenter}
            onChange={(value) => setFormData({ ...formData, costCenter: value })}
          />

          {/* Account Tags dropdown */}
          <TextField
            select
            fullWidth
            label="Account Tags"
            value={formData.accountTags}
            onChange={(e) => setFormData({ ...formData, accountTags: e.target.value })}
            size="small"
          >
            <MenuItem value="">Select account tag</MenuItem>
            {(accountTags as any[]).map((tag: any) => (
              <MenuItem key={tag.id} value={String(tag.id)}>
                {tag.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Decimal Values */}
          <TextField
            label="Decimal Values"
            name="decimalValues"
            size="small"
            fullWidth
            select
            value={formData.decimalValues}
            onChange={(e) => setFormData({ ...formData, decimalValues: e.target.value })}
          >
            <MenuItem value="no">No</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
          </TextField>

          {/* Graphics */}
          <TextField
            label="Graphics"
            name="graphics"
            size="small"
            fullWidth
            select
            value={formData.graphics}
            onChange={(e) => setFormData({ ...formData, graphics: e.target.value })}
          >
            <MenuItem value="No Graphics">No Graphics</MenuItem>
            <MenuItem value="vertical bars">Vertical Bars</MenuItem>
            <MenuItem value="Horizontal bars">Horizontal Bars</MenuItem>
            <MenuItem value="Dots">Dots</MenuItem>
            <MenuItem value="Lines">Lines</MenuItem>
            <MenuItem value="Pie">Pie</MenuItem>
            <MenuItem value="Donut">Donut</MenuItem>
            <MenuItem value="Half Donut">Half Donut</MenuItem>
            <MenuItem value="Splines">Splines</MenuItem>
          </TextField>

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
    </Stack>
  );
}
