import React, { ReactNode } from "react";
import { Stack } from "@mui/material";

interface FormPageLayoutProps {
  children: ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({ children }) => {
  return (
    <Stack
      spacing={2}
      sx={(theme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : "#ebfee6ff",
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
