import { BrowserRouter } from "react-router";
import { APP_ROUTER_BASENAME } from "./config/appConfig";
import AppRoutes from "./Routes.tsx";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { getDesignTokens } from "./theme.ts";
import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { QueryClientProvider } from "@tanstack/react-query";
import { OrganizationHeadSetter } from "../src/utils/index.html";
import queryClient from "./state/queryClient.ts";
import { AuthProvider } from "./context/AuthContext";
import { MessageDialogProvider } from "./context/MessageDialogContext";
import NotificationBridge from "./components/NotificationBridge";
import { snackbarComponents } from "./components/AppSnackbarContent";
import { ThemeContextProvider, useThemeContext } from "./context/ThemeContext";
import React, { useEffect } from "react";

const InnerApp = () => {
  const { mode } = useThemeContext();
  const theme = getDesignTokens(mode);

  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={APP_ROUTER_BASENAME}>
        <AuthProvider>
          <MessageDialogProvider>
            <SnackbarProvider
              maxSnack={5}
              autoHideDuration={4000}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              preventDuplicate
              Components={snackbarComponents}
              style={{ zIndex: 9999 }}
            >
              <NotificationBridge />
              <OrganizationHeadSetter />
              <AppRoutes />
            </SnackbarProvider>
          </MessageDialogProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeContextProvider>
          <InnerApp />
        </ThemeContextProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
