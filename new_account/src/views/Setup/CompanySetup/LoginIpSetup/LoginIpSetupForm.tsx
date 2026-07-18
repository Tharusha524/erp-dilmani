import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import SecurityIcon from "@mui/icons-material/Security";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import PageTitle from "../../../../components/PageTitle";
import Breadcrumb from "../../../../components/BreadCrumb";
import {
  getLoginIpSettings,
  updateLoginIpSettings,
} from "../../../../api/LoginIpSettings/LoginIpSettingsApi";
import { getFriendlyApiErrorMessage } from "../../../../utils/apiErrorMessage";

export default function LoginIpSetupForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [enabled, setEnabled] = useState(false);
  const [allowLocalhost, setAllowLocalhost] = useState(true);
  const [allowedIps, setAllowedIps] = useState("");
  const [detectedIp, setDetectedIp] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["loginIpSettings"],
    queryFn: getLoginIpSettings,
  });

  useEffect(() => {
    if (!data) return;
    setEnabled(data.loginIpRestrictionEnabled);
    setAllowLocalhost(data.loginIpAllowLocalhost);
    setAllowedIps(data.loginAllowedIps || "");
    setDetectedIp(data.detectedIp || "");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateLoginIpSettings,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["loginIpSettings"] });
      enqueueSnackbar(res.message || "Login IP settings saved.", { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(getFriendlyApiErrorMessage(error), { variant: "error" });
    },
  });

  const handleSave = () => {
    if (enabled && !allowLocalhost && !allowedIps.trim()) {
      enqueueSnackbar("Add at least one allowed IP before enabling restriction.", {
        variant: "warning",
      });
      return;
    }

    saveMutation.mutate({
      loginIpRestrictionEnabled: enabled,
      loginIpAllowLocalhost: allowLocalhost,
      loginAllowedIps: allowedIps,
    });
  };

  const addCurrentIp = () => {
    if (!detectedIp) return;
    const lines = allowedIps
      .split(/[\r\n,;]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.includes(detectedIp)) {
      lines.push(detectedIp);
    }
    setAllowedIps(lines.join("\n"));
  };

  return (
    <FormPageLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <PageTitle title="Login IP Restriction" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Setup", href: "/setup" },
              { title: "Company Setup", href: "/setup/companysetup" },
              { title: "Login IP Restriction" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Alert severity="info" icon={<SecurityIcon />}>
        When enabled, only users connecting from allowed IP addresses can sign in or use the system.
        Blocked attempts are recorded in User Login &amp; Daily Activity.
      </Alert>
      {detectedIp && (
        <Alert severity="warning">
          Your current IP detected by the server: <strong>{detectedIp}</strong>. Add this IP to the
          allowed list before enabling restriction, or keep &quot;Allow localhost&quot; checked for
          local development.
        </Alert>
      )}
      <Paper sx={{ p: 3 }}>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              }
              label="Enable login IP restriction (block all other IPs)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={allowLocalhost}
                  onChange={(e) => setAllowLocalhost(e.target.checked)}
                />
              }
              label="Always allow localhost (127.0.0.1) — recommended for development"
            />

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1">Allowed IP addresses</Typography>
                {detectedIp && (
                  <Button size="small" onClick={addCurrentIp}>
                    Add my current IP
                  </Button>
                )}
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={6}
                value={allowedIps}
                onChange={(e) => setAllowedIps(e.target.value)}
                placeholder={"203.0.113.10\n198.51.100.0/24\nOne IP or CIDR range per line"}
                helperText="Enter office/public IPs only. Users from any other IP cannot log in or use the API."
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              Save settings
            </Button>
          </Stack>
        )}
      </Paper>
    </FormPageLayout>
  );
}
