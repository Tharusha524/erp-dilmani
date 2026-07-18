import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
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
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";

interface BankStatementFormData {
  bankAccount: string;
  startDate: string;
  endDate: string;
  comments: string;
  destination: string;
}

export default function BankStatementWReconcileForm() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<BankStatementFormData>({
    bankAccount: "",
    startDate: "",
    endDate: "",
    comments: "",
    destination: "Print",
  });

  useApplyFiscalYearDates(setFormData, {
    startDate: "startDate",
    endDate: "endDate",
  });

  const [errors, setErrors] = useState<Partial<BankStatementFormData>>({});
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bankAccountsData = await getBankAccounts();
        setBankAccounts(bankAccountsData);
        
        // Set first bank account as default if available
        if (bankAccountsData.length > 0 && !formData.bankAccount) {
          setFormData(prev => ({ ...prev, bankAccount: bankAccountsData[0].id }));
        }
      } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
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
    let newErrors: Partial<BankStatementFormData> = {};

    if (!formData.bankAccount || formData.bankAccount === "") newErrors.bankAccount = "Bank account is required";
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
          Bank Statement Report
        </Typography>

        <Stack spacing={2}>
          {/* Bank Account dropdown */}
          <TextField
            label="Bank Account"
            name="bankAccount"
            size="small"
            fullWidth
            select
            value={formData.bankAccount}
            onChange={handleChange}
            error={!!errors.bankAccount}
            helperText={errors.bankAccount}
          >
            {bankAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.bank_account_name ?? (`${account.bank_name || ""} - ${account.bank_account_number || ""}`)}
              </MenuItem>
            ))}
          </TextField>

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
