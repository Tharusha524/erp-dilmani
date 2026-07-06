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
import { getCurrencies, Currency } from "../../../../api/Currency/currencyApi";
import { useReportGenerate } from "../../../../hooks/useReportGenerate";
import { getSuppliers } from "../../../../api/Supplier/SupplierApi";

interface Supplier {
  supplier_id: number;
  supp_name: string;
  // Add other fields as needed
}

interface OutstandingGRNsReportFormData {
  supplier: string;
  comments: string;
  orientation: string;
  destination: string;
}

export default function OutstandingGRNsReportForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<OutstandingGRNsReportFormData>({
    supplier: "NoFilter",
    comments: "",
    orientation: "Portrait",
    destination: "Print",
  });

  const [errors, setErrors] = useState<Partial<OutstandingGRNsReportFormData>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currenciesData, suppliersData] = await Promise.all([
          getCurrencies(),
          getSuppliers(),
        ]);
        setCurrencies(currenciesData);
        setSuppliers(suppliersData);
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
    let newErrors: Partial<OutstandingGRNsReportFormData> = {};

    if (!formData.supplier) newErrors.supplier = "Supplier is required";

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
          Supplier Trial Balances Report
        </Typography>

        <Stack spacing={2}>

          {/* Customer dropdown */}
          <TextField
            label="Supplier"
            name="supplier"
            size="small"
            fullWidth
            select
            value={formData.supplier}
            onChange={handleChange}
            error={!!errors.supplier}
            helperText={errors.supplier}
          >
            <MenuItem value="NoFilter">No supplier filter</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                {supplier.supp_name}
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
