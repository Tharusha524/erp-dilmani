import { PaletteMode } from "@mui/material";
import { createTheme } from "@mui/material/styles";

export const getDesignTokens = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark' && {
        // Dark mode: dark backgrounds
        background: {
          default: "#0f172a",
          paper: "#1e293b",
        },
      }),
    },
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
  });
};

export default getDesignTokens('light');

