import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import theme from "../../../../theme";
import { createChartMaster } from "../../../../api/GLAccounts/ChartMasterApi";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ErrorModal from "../../../../components/ErrorModal";
import SuccessModal from "../../../../components/SuccessModal";

interface ChartOfAccountsFormData {
  newAccount: string;
  inactive: boolean;
  accountCode: string;
  accountCode2: string;
  accountName: string;
  accountGroup: string;
  accountTags: string;
  accountStatus: string;
}

export default function AddChartofAccounts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState<ChartOfAccountsFormData>({
    newAccount: "",
    inactive: false,
    accountCode: "",
    accountCode2: "",
    accountName: "",
    accountGroup: "",
    accountTags: "",
    accountStatus: "",
  });

  const [errors, setErrors] = useState<Partial<ChartOfAccountsFormData>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<ChartOfAccountsFormData> = {};

    if (!formData.newAccount) newErrors.newAccount = "New Account is required";
    if (!formData.accountCode) newErrors.accountCode = "Account Code is required";
    if (!formData.accountName) newErrors.accountName = "Account Name is required";
    if (!formData.accountGroup) newErrors.accountGroup = "Account Group is required";
    if (!formData.accountStatus) newErrors.accountStatus = "Account Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        await createChartMaster({
          account_code: formData.accountCode,
          account_code_2: formData.accountCode2,
          account_name: formData.accountName,
          account_type: formData.newAccount,
          account_group: formData.accountGroup,
          account_tags: formData.accountTags,
          status: formData.accountStatus,
          inactive: formData.inactive ? 1 : 0,
        });
        queryClient.invalidateQueries({ queryKey: ["chartMasters"] });
        setOpen(true);
      } catch (error: any) {
        setErrorMessage(
          error?.message ||
          error?.response?.data?.message ||
          "Failed to add chart of accounts. Please try again."
        );
        setErrorOpen(true);
        console.error("Error adding chart of accounts:", error);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper
        sx={{
          p: theme.spacing(3),
          maxWidth: "600px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          Add Chart of Accounts
        </Typography>

        <Stack spacing={2}>
          {/* New Account Dropdown */}
          <FormControl size="small" fullWidth error={!!errors.newAccount}>
            <InputLabel>New Account</InputLabel>
            <Select
              name="newAccount"
              value={formData.newAccount}
              onChange={handleChange}
              label="New Account"
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="CurrentAssets">1. Current Assets</MenuItem>
              <MenuItem value="Bank">Bank</MenuItem>
              <MenuItem value="Receivable">Receivable</MenuItem>
              <MenuItem value="Payable">Payable</MenuItem>
            </Select>
            {errors.newAccount && <FormHelperText>{errors.newAccount}</FormHelperText>}
          </FormControl>

          {/* Inactive Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.inactive}
                onChange={handleCheckboxChange}
                name="inactive"
              />
            }
            label="Inactive"
          />

          {/* Account Code */}
          <TextField
            label="Account Code"
            name="accountCode"
            size="small"
            fullWidth
            value={formData.accountCode}
            onChange={handleChange}
            error={!!errors.accountCode}
            helperText={errors.accountCode}
          />

          {/* Account Code 2 */}
          <TextField
            label="Account Code 2"
            name="accountCode2"
            size="small"
            fullWidth
            value={formData.accountCode2}
            onChange={handleChange}
          />

          {/* Account Name */}
          <TextField
            label="Account Name"
            name="accountName"
            size="small"
            fullWidth
            value={formData.accountName}
            onChange={handleChange}
            error={!!errors.accountName}
            helperText={errors.accountName}
          />

          {/* Account Group Dropdown */}
          <FormControl size="small" fullWidth error={!!errors.accountGroup}>
            <InputLabel>Account Group</InputLabel>
            <Select
              name="accountGroup"
              value={formData.accountGroup}
              onChange={handleChange}
              label="Account Group"
            >
              <MenuItem value="">-- Select Group --</MenuItem>
              <MenuItem value="Assets">Assets</MenuItem>
              <MenuItem value="Liabilities">Liabilities</MenuItem>
              <MenuItem value="Equity">Equity</MenuItem>
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </Select>
            {errors.accountGroup && (
              <FormHelperText>{errors.accountGroup}</FormHelperText>
            )}
          </FormControl>

          {/* Account Tags */}
          <TextField
            label="Account Tags"
            name="accountTags"
            size="small"
            fullWidth
            value={formData.accountTags}
            onChange={handleChange}
          />

          {/* Account Status Dropdown */}
          <FormControl size="small" fullWidth error={!!errors.accountStatus}>
            <InputLabel>Account Status</InputLabel>
            <Select
              name="accountStatus"
              value={formData.accountStatus}
              onChange={handleChange}
              label="Account Status"
            >
              <MenuItem value="">-- Select Status --</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            {errors.accountStatus && (
              <FormHelperText>{errors.accountStatus}</FormHelperText>
            )}
          </FormControl>
        </Stack>

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            mt: 3,
            gap: isMobile ? 2 : 0,
          }}
        >
          <Button fullWidth={isMobile} onClick={() => window.history.back()}>
            Back
          </Button>

          <Button
            variant="contained"
            fullWidth={isMobile}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            Add Account
          </Button>
        </Box>
      </Paper>

      {/* Success Modal */}
      <SuccessModal
        open={open}
        onClose={() => {
          setOpen(false);
          navigate(-1);
        }}
        message="Chart of Accounts added successfully!"
      />

      {/* Error Modal */}
      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}
