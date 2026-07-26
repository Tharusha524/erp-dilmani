import React, { ReactNode } from "react";
import { Stack, CircularProgress, Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getSysPrefs } from "../../api/OrganizationSettings/SysPrefsApi";

interface FormPageLayoutProps {
  children: ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({ children }) => {
  const { data: sysPrefs, isLoading } = useQuery({
    queryKey: ["sys-prefs"],
    queryFn: getSysPrefs,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Find the 'form_bg_color' setting, or default to original green
  const bgPref = sysPrefs?.find((pref) => pref.name === "form_bg_color");
  const defaultBgColor = bgPref?.value || "#ebfee6ff";

  return (
    <Stack
      spacing={2}
      sx={(theme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : defaultBgColor,
        minHeight: "100%",
        p: 4,
        borderRadius: 5,
        "& > .MuiBox-root:first-of-type": {
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : "#ffffffff",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#ddddddff",
            borderWidth: "2px",
          },
          "&:hover fieldset": {
            borderColor: "#a6dca8",
            borderWidth: "2px",
          },
        }
      })}
    >
      {children}
    </Stack>
  );
};
