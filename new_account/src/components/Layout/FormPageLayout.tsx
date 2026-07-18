import React, { ReactNode } from "react";
import { Stack } from "@mui/material";

interface FormPageLayoutProps {
  children: ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({ children }) => {
  return (
    <Stack
      spacing={2}
      sx={{
        backgroundColor: "#ebfee6ff",
        minHeight: "100%",
        p: 4,
        borderRadius: 5,
        "& > .MuiBox-root:first-of-type": {
          backgroundColor: "#ffffffff",
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
      }}
    >
      {children}
    </Stack>
  );
};
