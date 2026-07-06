import React, { useState } from "react";
import { useCostCenters, costCenterLabel } from "../../../../hooks/useCostCenters";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
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

interface CostCenterSummaryFormData {
  fromCostCenter: string;
  toCostCenter: string;
  showBalance: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function CostCenterSummaryForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<CostCenterSummaryFormData>({
    fromCostCenter: "",
    toCostCenter: "",
    showBalance: "no",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  const [errors, setErrors] = useState<Partial<CostCenterSummaryFormData>>({});
  const { data: costCenters = [] } = useCostCenters();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<CostCenterSummaryFormData> = {};

    if (!formData.fromCostCenter) newErrors.fromCostCenter = "From costCenter is required";
    if (!formData.toCostCenter) newErrors.toCostCenter = "To costCenter is required";

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
          CostCenter Summary Report
        </Typography>

        <Stack spacing={2}>
          {/* From CostCenter dropdown */}
          <TextField
            label="From CostCenter"
            name="fromCostCenter"
            size="small"
            fullWidth
            select
            value={formData.fromCostCenter}
            onChange={handleChange}
            error={!!errors.fromCostCenter}
            helperText={errors.fromCostCenter}
          >
            <MenuItem value="">Select costCenter</MenuItem>
            {costCenters.map((costCenter) => (
              <MenuItem key={costCenter.id} value={String(costCenter.id)}>
                {costCenterLabel(costCenter)}
              </MenuItem>
            ))}
          </TextField>

          {/* To CostCenter dropdown */}
          <TextField
            label="To CostCenter"
            name="toCostCenter"
            size="small"
            fullWidth
            select
            value={formData.toCostCenter}
            onChange={handleChange}
            error={!!errors.toCostCenter}
            helperText={errors.toCostCenter}
          >
            <MenuItem value="">Select costCenter</MenuItem>
            {costCenters.map((costCenter) => (
              <MenuItem key={costCenter.id} value={String(costCenter.id)}>
                {costCenterLabel(costCenter)}
              </MenuItem>
            ))}
          </TextField>

          {/* Show Balance dropdown */}
          <TextField
            label="Show Balance"
            name="showBalance"
            size="small"
            fullWidth
            select
            value={formData.showBalance}
            onChange={handleChange}
          >
            <MenuItem value="no">No</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
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
