import { PaletteMode } from "@mui/material";
import { createTheme } from "@mui/material/styles";

export const getDesignTokens = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark' && {
        // Dark mode: dark backgrounds
        background: {
          default: "#121212",
          paper: "#1e1e1e",
        },
      }),
    },
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
  });
};

export default getDesignTokens('light');

