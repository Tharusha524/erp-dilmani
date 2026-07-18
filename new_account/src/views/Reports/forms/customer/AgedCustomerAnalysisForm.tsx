import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
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
import { getCustomers } from "../../../../api/Customer/AddCustomerApi";
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";
import { generateAgedCustomerAnalysisReport } from "../../../../api/Reports/ReportsApi";
import { useSnackbar } from "notistack";

interface Customer {
  debtor_no: number;
  name: string;
  // Add other fields as needed
}

interface AgedCustomerAnalysisFormData {
  endDate: string;
  customer: string;
  currencyFilter: string;
  showAllocated: string;
  summary: string;
  suppressZeros: string;
  graphics: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function AgedCustomerAnalysisForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<AgedCustomerAnalysisFormData>({
    endDate: "",
    customer: "NoFilter",
    showAllocated: "Yes",
    currencyFilter: "NoFilter",
    summary: "No",
    graphics: "No",
    suppressZeros: "No",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, { endDate: "endDate" });

  const [errors, setErrors] = useState<Partial<AgedCustomerAnalysisFormData>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, currenciesData] = await Promise.all([
          getCustomers(),
          getCurrencies(),
        ]);
        setCustomers(customersData);
        setCurrencies(currenciesData);
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
    let newErrors: Partial<AgedCustomerAnalysisFormData> = {};

    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.customer) newErrors.customer = "Customer is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    try {
      const blob = await generateAgedCustomerAnalysisReport({
        endDate: formData.endDate,
        from_customer: formData.customer === 'NoFilter' ? null : formData.customer,
        to_customer: formData.customer === 'NoFilter' ? null : formData.customer,
        currency: formData.currencyFilter === 'NoFilter' ? 'all' : formData.currencyFilter,
        showAll: formData.suppressZeros === 'No' ? 'Yes' : 'No'
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `aged_customer_analysis_${formData.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar("Report generated successfully", { variant: "success" });
    } catch (error) {
      console.error("Failed to generate report:", error);
      enqueueSnackbar("Failed to generate report", { variant: "error" });
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

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
          Aged Customer Analysis Report
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

          {/* Customer dropdown */}
          <TextField
            label="Customer"
            name="customer"
            size="small"
            fullWidth
            select
            value={formData.customer}
            onChange={handleChange}
            error={!!errors.customer}
            helperText={errors.customer}
          >
            <MenuItem value="NoFilter">No customer filter</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.debtor_no} value={customer.debtor_no.toString()}>
                {customer.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Currency Filter */}
          <TextField
            label="Currency Filter"
            name="currencyFilter"
            size="small"
            fullWidth
            select
            value={formData.currencyFilter}
            onChange={handleChange}
          >
            <MenuItem value="NoFilter">No currency filter</MenuItem>
            {currencies.map((currency) => (
              <MenuItem key={currency.id} value={currency.currency_abbreviation}>
                {currency.currency_abbreviation} - {currency.currency_name}
              </MenuItem>
            ))}
          </TextField>

          {/* Show also allocated dropdown */}
          <TextField
            label="Show Also Allocated"
            name="showAllocated"
            size="small"
            fullWidth
            select
            value={formData.showAllocated}
            onChange={handleChange}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
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

          {/* Suppress Zeros */}
          <TextField
            label="Suppress Zeros"
            name="suppressZeros"
            size="small"
            fullWidth
            select
            value={formData.suppressZeros}
            onChange={handleChange}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>

            <TextField
            label="Graphics"
            name="graphics"
            size="small"
            fullWidth
            select
            value={formData.graphics}
            onChange={handleChange}
          >
            <MenuItem value="No">No Graphics</MenuItem>
            <MenuItem value="vertical">Vertical Bars</MenuItem>
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
    </FormPageLayout>
  );
}
