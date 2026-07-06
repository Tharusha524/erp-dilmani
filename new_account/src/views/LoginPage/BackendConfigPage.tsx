import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import LinkIcon from "@mui/icons-material/Link";
import { useNavigate } from "react-router";
import {
  clearStoredApiBaseUrl,
  getApiBaseUrl,
  getStoredApiBaseUrl,
  normalizeApiBaseUrl,
  setStoredApiBaseUrl,
  testApiConnection,
} from "../../config/backendConfig";
import { DEFAULT_API_BASE_URL } from "../../config/appConfig";

export default function BackendConfigPage() {
  const navigate = useNavigate();
  const [backendUrl, setBackendUrl] = useState("");
  const [previewApiUrl, setPreviewApiUrl] = useState("");
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getStoredApiBaseUrl();
    const initial = stored ?? DEFAULT_API_BASE_URL.replace(/\/index\.php\/api$/, "/public/");
    setBackendUrl(initial);
    setPreviewApiUrl(normalizeApiBaseUrl(initial) || getApiBaseUrl());
  }, []);

  useEffect(() => {
    setPreviewApiUrl(backendUrl.trim() ? normalizeApiBaseUrl(backendUrl) : "");
  }, [backendUrl]);

  const handleTest = async () => {
    setError("");
    setTestResult(null);
    if (!backendUrl.trim()) {
      setError("Enter a backend URL first.");
      return;
    }
    setTesting(true);
    try {
      const apiUrl = normalizeApiBaseUrl(backendUrl);
      const result = await testApiConnection(apiUrl);
      setTestResult({ ok: result.ok, message: result.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setTestResult(null);
    setSaving(true);
    try {
      const saved = setStoredApiBaseUrl(backendUrl);
      const result = await testApiConnection(saved);
      if (!result.ok) {
        setTestResult({ ok: false, message: result.message });
        setError("Saved, but connection test failed. Fix the URL or check the server.");
        return;
      }
      setTestResult({ ok: true, message: "Saved and connected. You can log in now." });
      setTimeout(() => navigate("/", { replace: true }), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    clearStoredApiBaseUrl();
    const fallback = DEFAULT_API_BASE_URL.replace(/\/index\.php\/api$/, "/public/");
    setBackendUrl(fallback);
    setPreviewApiUrl(DEFAULT_API_BASE_URL);
    setTestResult({ ok: true, message: "Reset to default. Click Save to apply." });
    setError("");
  };

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "100vh", p: 2, bgcolor: "#f5f7fa" }}
    >
      <Paper sx={{ p: 3, maxWidth: 560, width: "100%", borderRadius: 2, boxShadow: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Backend configuration
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your Laravel backend public URL. The app will connect to{" "}
          <strong>…/index.php/api</strong> for login and all ERP data.
        </Typography>

        <TextField
          label="Backend URL"
          fullWidth
          size="small"
          value={backendUrl}
          onChange={(e) => {
            setBackendUrl(e.target.value);
            setError("");
            setTestResult(null);
          }}
          placeholder="https://your-domain.com/sky_erp/backend/public"
          helperText="Example: https://finance.skytechsl.com/sky_erp/backend/public"
          InputProps={{
            startAdornment: <LinkIcon sx={{ mr: 1, color: "action.active", fontSize: 20 }} />,
          }}
          sx={{ mb: 1 }}
        />

        {previewApiUrl && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            API endpoint: <code>{previewApiUrl}</code>
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {testResult && (
          <Alert severity={testResult.ok ? "success" : "warning"} sx={{ mb: 2 }}>
            {testResult.message}
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={testing || !backendUrl.trim()}
            startIcon={testing ? <CircularProgress size={16} /> : undefined}
          >
            Test connection
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !backendUrl.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
          >
            Save & connect
          </Button>
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Back to login
          </Button>
          <Button variant="text" color="secondary" onClick={handleReset}>
            Reset to default
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}
