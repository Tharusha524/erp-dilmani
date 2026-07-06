import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useMemo, useState } from "react";
import {
  generateStrongPassword,
  getPasswordPolicyChecks,
  getPasswordPolicySummary,
} from "../utils/passwordPolicy";

interface UserPasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  passwordError?: string;
  confirmPasswordError?: string;
  required?: boolean;
  optionalHint?: string;
  /** Edit user: account already has a password (shown masked — never sent from API). */
  hasExistingPassword?: boolean;
}

export default function UserPasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordError,
  confirmPasswordError,
  required = true,
  optionalHint,
  hasExistingPassword = false,
}: UserPasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPasswordMask, setShowCurrentPasswordMask] = useState(false);
  const policyChecks = useMemo(() => getPasswordPolicyChecks(password), [password]);
  const existingPasswordMask = "••••••••••••";

  const handleGenerate = () => {
    const generated = generateStrongPassword();
    onPasswordChange(generated);
    onConfirmPasswordChange(generated);
    setShowPassword(true);
  };

  return (
    <Stack spacing={1.5}>
      {hasExistingPassword && (
        <Box>
          <TextField
            label="Current password"
            size="small"
            fullWidth
            value={existingPasswordMask}
            disabled
            type={showCurrentPasswordMask ? "text" : "password"}
            helperText="Previous password is stored securely and cannot be displayed. Leave new fields empty to keep it."
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showCurrentPasswordMask
                        ? "Hide current password indicator"
                        : "Show current password indicator"
                    }
                    onClick={() => setShowCurrentPasswordMask((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showCurrentPasswordMask ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showCurrentPasswordMask}
                onChange={(e) => setShowCurrentPasswordMask(e.target.checked)}
                size="small"
              />
            }
            label="Show current password"
            sx={{ mt: 0.5 }}
          />
        </Box>
      )}

      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "action.hover",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Password policy
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {optionalHint ?? getPasswordPolicySummary()}
        </Typography>
        <Stack spacing={0.5}>
          {policyChecks.map((check) => (
            <Stack key={check.id} direction="row" spacing={1} alignItems="center">
              {check.passed ? (
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} />
              ) : (
                <RadioButtonUncheckedIcon color="disabled" sx={{ fontSize: 18 }} />
              )}
              <Typography
                variant="caption"
                color={check.passed ? "success.main" : "text.secondary"}
              >
                {check.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AutoFixHighIcon />}
          onClick={handleGenerate}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          Generate strong password
        </Button>
      </Stack>

      <TextField
        label={required ? "Password" : "New password (optional)"}
        name="password"
        type={showPassword ? "text" : "password"}
        size="small"
        fullWidth
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        error={!!passwordError}
        helperText={passwordError}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="Confirm password"
        name="confirmPassword"
        type={showPassword ? "text" : "password"}
        size="small"
        fullWidth
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        error={!!confirmPasswordError}
        helperText={confirmPasswordError}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            size="small"
          />
        }
        label="Show password"
      />
    </Stack>
  );
}
