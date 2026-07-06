import React, { useState, useEffect, useMemo } from "react";
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
import { getFiscalYears } from "../../../../api/FiscalYear/FiscalYearApi";
import { getAccountTags } from "../../../../api/AccountTag/AccountTagsApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import ReportDimensionSelect from "../../../../components/ReportDimensionSelect";

interface AnnualExpenseBreakdownFormData {
  year: string;
  dimension: string;
  accountTags: string;
  comments: string;
  orientation: string;
  amountsInThousands: string;
  destination: string;
}

export default function AnnualExpenseBreakdownForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<AnnualExpenseBreakdownFormData>({
    year: "",
    dimension: "",
    accountTags: "",
    comments: "",
    orientation: "Portrait",
    amountsInThousands: "no",
    destination: "Print",
  });

  const [errors, setErrors] = useState<Partial<AnnualExpenseBreakdownFormData>>({});

  // Fetch fiscal years
  const { data: fiscalYears = [] } = useQuery({
    queryKey: ["fiscalYears"],
    queryFn: getFiscalYears,
  });

  // Fetch account tags
  const { data: accountTags = [] } = useQuery({
    queryKey: ["accountTags"],
    queryFn: getAccountTags,
  });

  // Set default values when data loads
  useEffect(() => {
    if (fiscalYears.length > 0 && !formData.year) {
      const currentFY = fiscalYears.find((fy: any) => !fy.isClosed);
      setFormData(prev => ({
        ...prev,
        year: currentFY ? String(currentFY.id) : String(fiscalYears[0].id),
      }));
    }
  }, [fiscalYears]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simple validation
  const validate = () => {
    let newErrors: Partial<AnnualExpenseBreakdownFormData> = {};

    if (!formData.year) newErrors.year = "Year is required";

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
          Annual Expense Breakdown Report
        </Typography>

        <Stack spacing={2}>
          {/* Year dropdown */}
          <TextField
            select
            fullWidth
            label="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            size="small"
            error={!!errors.year}
            helperText={errors.year}
          >
            <MenuItem value="">Select fiscal year</MenuItem>
            {(fiscalYears as any[]).map((fy: any) => (
              <MenuItem key={fy.id} value={String(fy.id)}>
                {fy.fiscal_year_from} - {fy.fiscal_year_to} {fy.closed ? "Closed" : "Active"}
              </MenuItem>
            ))}
          </TextField>

          <ReportDimensionSelect
            value={formData.dimension}
            onChange={(value) => setFormData({ ...formData, dimension: value })}
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

          {/* Amounts in thousands */}
          <TextField
            label="Amounts in thousands"
            name="amountsInThousands"
            size="small"
            fullWidth
            select
            value={formData.amountsInThousands}
            onChange={(e) => setFormData({ ...formData, amountsInThousands: e.target.value })}
          >
            <MenuItem value="no">No</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
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
