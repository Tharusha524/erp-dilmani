import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getSysPrefs, bulkUpdateSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { ChromePicker, ColorResult } from "react-color";
import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import SaveIcon from "@mui/icons-material/Save";

export default function BackgroundColorSettings() {
  const queryClient = useQueryClient();
  const [color, setColor] = useState("#ebfee6ff");

  const { data: sysPrefs, isLoading } = useQuery({
    queryKey: ["sys-prefs"],
    queryFn: getSysPrefs,
  });

  useEffect(() => {
    if (sysPrefs) {
      const bgPref = sysPrefs.find((pref) => pref.name === "form_bg_color");
      if (bgPref && bgPref.value) {
        setColor(bgPref.value);
      }
    }
  }, [sysPrefs]);

  const { mutate: saveColor, isPending } = useMutation({
    mutationFn: (newColor: string) => bulkUpdateSysPrefs({ form_bg_color: newColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sys-prefs"] });
      enqueueSnackbar("Background color updated successfully", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to update background color", { variant: "error" });
    },
  });

  const handleColorChange = (colorResult: ColorResult) => {
    const { r, g, b, a } = colorResult.rgb;
    // convert rgba to hex with alpha
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    const alphaHex = a !== undefined ? toHex(Math.round(a * 255)) : "ff";
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
    setColor(hex);
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
        <Paper elevation={3} sx={{ p: 4, maxWidth: "600px", margin: "0 auto" }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Form Background Color
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Choose a background color for the form layouts across the ERP system. The change will be applied globally once you save.
          </Typography>

          <Stack alignItems="center" spacing={4}>
            <ChromePicker color={color} onChange={handleColorChange} />

            <Box
              sx={{
                width: "100%",
                height: 100,
                borderRadius: 2,
                backgroundColor: color,
                border: "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "#333", backgroundColor: "rgba(255,255,255,0.7)", px: 2, py: 1, borderRadius: 1 }}>
                Live Preview
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              onClick={() => saveColor(color)}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Background Color"}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </FormPageLayout>
  );
}
