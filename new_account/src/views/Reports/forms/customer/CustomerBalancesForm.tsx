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
import { generateCustomerBalancesReport } from "../../../../api/Reports/ReportsApi";
import { useSnackbar } from "notistack";

interface Customer {
  debtor_no: number;
  name: string;
  // Add other fields as needed
}

interface CustomerBalancesFormData {
  startDate: string;
  endDate: string;
  customer: string;
  showBalance: string;
  currencyFilter: string;
  suppressZeros: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function CustomerBalancesForm() {
  const muiTheme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<CustomerBalancesFormData>({
    startDate: "",
    endDate: "",
    customer: "NoFilter",
    showBalance: "Yes",
    currencyFilter: "NoFilter",
    suppressZeros: "No",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, {
    startDate: "startDate",
    endDate: "endDate",
  });

  const [errors, setErrors] = useState<Partial<CustomerBalancesFormData>>({});
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
    let newErrors: Partial<CustomerBalancesFormData> = {};

    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.customer) newErrors.customer = "Customer is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    try {
      const blob = await generateCustomerBalancesReport(formData);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Customer_Balances_${formData.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      enqueueSnackbar("Report generated successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to generate report", { variant: "error" });
      console.error("Report Generation Error:", error);
    }
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
          Customer Balances Report
        </Typography>

        <Stack spacing={2}>
          {/* Dates */}
          <TextField
            label="Start Date"
            type="date"
            name="startDate"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={handleChange}
            error={!!errors.startDate}
            helperText={errors.startDate}
          />

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

          {/* Show balance dropdown */}
          <TextField
            label="Show Balance"
            name="showBalance"
            size="small"
            fullWidth
            select
            value={formData.showBalance}
            onChange={handleChange}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
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
