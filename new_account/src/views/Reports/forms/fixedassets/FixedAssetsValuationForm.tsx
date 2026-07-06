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
} from "@mui/material";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { useApplyFiscalYearDates } from "../../../../hooks/useApplyFiscalYearDates";
import { getLocations as getFixedAssetsLocations } from "../../../../api/FixedAssetsLocation/FixedAssetsLocationApi";
import { getStockFaClasses } from "../../../../api/StockFaClass/StockFaClassesApi";

interface FixedAssetsValuationFormData {
  endDate: string;
  summary: string;
  comments: string;
  orientation: string;
  destination: string;
  fixedAssetsClass: string;
  fixedAssetsLocation: string;
}

export default function FixedAssetsValuationForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<FixedAssetsValuationFormData>({
    endDate: "",
    summary: "No",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
    fixedAssetsClass: "NoFilter",
    fixedAssetsLocation: "NoFilter",
  });

  useApplyFiscalYearDates(setFormData, { endDate: "endDate" });

  const [errors, setErrors] = useState<Partial<FixedAssetsValuationFormData>>({});
  const [faClasses, setFaClasses] = useState<any[]>([]);
  const [fixedAssetsLocations, setFixedAssetsLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faClassesData, fixedAssetsLocationsData] = await Promise.all([
          getStockFaClasses(),
          getFixedAssetsLocations(),
        ]);
        setFaClasses(faClassesData);
        setFixedAssetsLocations(fixedAssetsLocationsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<FixedAssetsValuationFormData> = {};

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
          Fixed Assets Valuation Report
        </Typography>

        <Stack spacing={2}>
          {/* Dates */}
          <TextField
            label="End Date"
            type="date"
            name="endDate"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.endDate}
            onChange={handleChange}
            error={!!errors.endDate}
            helperText={errors.endDate}
          />

          {/* Fixed Assets Class dropdown */}
          <TextField
            label="Fixed Assets Class"
            name="fixedAssetsClass"
            size="small"
            fullWidth
            select
            value={formData.fixedAssetsClass}
            onChange={handleChange}
          >
            <MenuItem value="NoFilter">All classes</MenuItem>
            {faClasses.map((cls) => (
              <MenuItem key={cls.fa_class_id} value={cls.fa_class_id}>
                {cls.description}
              </MenuItem>
            ))}
          </TextField>

          {/* Fixed Assets Location dropdown */}
          <TextField
            label="Fixed Assets Location"
            name="fixedAssetsLocation"
            size="small"
            fullWidth
            select
            value={formData.fixedAssetsLocation}
            onChange={handleChange}
          >
            <MenuItem value="NoFilter">All locations</MenuItem>
            {fixedAssetsLocations.map((location) => (
              <MenuItem key={location.locationCode} value={location.locationCode}>
                {location.locationName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Summary"
            name="summary"
            size="small"
            fullWidth
            select
            value={formData.summary}
            onChange={handleChange}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>

          {/* Comments */}
          <TextField
            label="Comments"
            name="comments"
            size="small"
            fullWidth
            multiline
            minRows={2}
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
