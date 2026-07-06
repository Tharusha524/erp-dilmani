import React, { useState } from "react";
import { useDimensions, dimensionLabel } from "../../../../hooks/useDimensions";
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

interface DimensionSummaryFormData {
  fromDimension: string;
  toDimension: string;
  showBalance: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function DimensionSummaryForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<DimensionSummaryFormData>({
    fromDimension: "",
    toDimension: "",
    showBalance: "no",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  const [errors, setErrors] = useState<Partial<DimensionSummaryFormData>>({});
  const { data: dimensions = [] } = useDimensions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<DimensionSummaryFormData> = {};

    if (!formData.fromDimension) newErrors.fromDimension = "From dimension is required";
    if (!formData.toDimension) newErrors.toDimension = "To dimension is required";

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
          Dimension Summary Report
        </Typography>

        <Stack spacing={2}>
          {/* From Dimension dropdown */}
          <TextField
            label="From Dimension"
            name="fromDimension"
            size="small"
            fullWidth
            select
            value={formData.fromDimension}
            onChange={handleChange}
            error={!!errors.fromDimension}
            helperText={errors.fromDimension}
          >
            <MenuItem value="">Select dimension</MenuItem>
            {dimensions.map((dimension) => (
              <MenuItem key={dimension.id} value={String(dimension.id)}>
                {dimensionLabel(dimension)}
              </MenuItem>
            ))}
          </TextField>

          {/* To Dimension dropdown */}
          <TextField
            label="To Dimension"
            name="toDimension"
            size="small"
            fullWidth
            select
            value={formData.toDimension}
            onChange={handleChange}
            error={!!errors.toDimension}
            helperText={errors.toDimension}
          >
            <MenuItem value="">Select dimension</MenuItem>
            {dimensions.map((dimension) => (
              <MenuItem key={dimension.id} value={String(dimension.id)}>
                {dimensionLabel(dimension)}
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
