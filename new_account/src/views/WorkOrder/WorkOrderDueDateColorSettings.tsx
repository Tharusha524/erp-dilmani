import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { ChromePicker, ColorResult } from "react-color";
import SaveIcon from "@mui/icons-material/Save";
import { getSysPrefs, bulkUpdateSysPrefs } from "../../api/OrganizationSettings/SysPrefsApi";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";

export const WO_DUE_COLOR_DEFAULTS = {
  urgent: "#ffcdd2",
  warning: "#fff9c4",
  safe: "#c8e6c9",
};

const SWATCHES: { key: keyof typeof WO_DUE_COLOR_DEFAULTS; prefName: string; label: string; hint: string }[] = [
  { key: "urgent", prefName: "wo_due_color_urgent", label: "Urgent (due soon)", hint: "Delivery date is very close." },
  { key: "warning", prefName: "wo_due_color_warning", label: "Warning (due mid-range)", hint: "Delivery date is approaching." },
  { key: "safe", prefName: "wo_due_color_safe", label: "Safe (plenty of time)", hint: "Delivery date is comfortably far away." },
];

export default function WorkOrderDueDateColorSettings() {
  const queryClient = useQueryClient();
  const [colors, setColors] = useState({ ...WO_DUE_COLOR_DEFAULTS });
  const [activePicker, setActivePicker] = useState<keyof typeof WO_DUE_COLOR_DEFAULTS | null>(null);

  const { data: sysPrefs, isLoading } = useQuery({
    queryKey: ["sys-prefs"],
    queryFn: getSysPrefs,
  });

  useEffect(() => {
    if (!sysPrefs) return;
    setColors((prev) => {
      const next = { ...prev };
      SWATCHES.forEach(({ key, prefName }) => {
        const pref = sysPrefs.find((p) => p.name === prefName);
        if (pref && pref.value) next[key] = pref.value;
      });
      return next;
    });
  }, [sysPrefs]);

  const { mutate: saveColors, isPending } = useMutation({
    mutationFn: () =>
      bulkUpdateSysPrefs({
        wo_due_color_urgent: colors.urgent,
        wo_due_color_warning: colors.warning,
        wo_due_color_safe: colors.safe,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sys-prefs"] });
      enqueueSnackbar("Due Date colors updated successfully", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Failed to update Due Date colors", { variant: "error" }),
  });

  const handleColorChange = (key: keyof typeof WO_DUE_COLOR_DEFAULTS, colorResult: ColorResult) => {
    const { r, g, b, a } = colorResult.rgb;
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    const alphaHex = a !== undefined ? toHex(Math.round(a * 255)) : "ff";
    setColors((prev) => ({ ...prev, [key]: `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}` }));
  };

  if (isLoading) {
    return (
      <FormPageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Change Color
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose the colors used to highlight a work order's row in the list table, based on how close its
          delivery date is.
        </Typography>

        <Grid container spacing={2}>
          {SWATCHES.map(({ key, label, hint }) => (
            <Grid item xs={12} md={4} key={key}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography fontWeight={700}>{label}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {hint}
                </Typography>
                <Box
                  onClick={() => setActivePicker(activePicker === key ? null : key)}
                  sx={{
                    height: 56,
                    borderRadius: 1,
                    backgroundColor: colors[key],
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                />
                {activePicker === key && (
                  <Box sx={{ mt: 1.5 }}>
                    <ChromePicker color={colors[key]} onChange={(c) => handleColorChange(key, c)} />
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={() => saveColors()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Colors"}
          </Button>
        </Stack>
      </Box>
    </FormPageLayout>
  );
}
