import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageTitle from "../../components/PageTitle";
import Breadcrumb from "../../components/BreadCrumb";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PERMISSION_ID_MAP } from "../../permissions/map";
import { reportClasses } from "./reportClasses";
import { ReportGenerationProvider } from "../../context/ReportGenerationContext";
import { reportKeyFromTitle } from "./reportKeys";

// Permission mapping for report classes
const REPORT_CLASS_PERMISSIONS: Record<string, number> = {
  Customer: PERMISSION_ID_MAP["Sales analytical reports"],
  Supplier: PERMISSION_ID_MAP["Supplier analytical reports"],
  Inventory: PERMISSION_ID_MAP["Inventory Analytics"],
  Manufacturing: PERMISSION_ID_MAP["Manufacturing Analytics"],
  FixedAssets: PERMISSION_ID_MAP["Fixed Asset analytical reports and inquiries"],
  CostCenters: PERMISSION_ID_MAP["CostCenter reports"],
  Banking: PERMISSION_ID_MAP["Banking & GL Analytics"],
  GeneralLedger: PERMISSION_ID_MAP["GL reports and inquiries"],
};

// Dynamic form loader
const formLoader = async (className: string, reportName: string) => {
  return await import(
    `./forms/${className}/${reportName.replace(/ /g, "")}Form.tsx`
  );
};

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedReport, setSelectedReport] = useState("");
  const [LoadedForm, setLoadedForm] = useState<React.ComponentType | null>(
    null
  );

  // Check if user has permission for a report class
  const hasClassPermission = (className: string) => {
    const requiredPermission = REPORT_CLASS_PERMISSIONS[className];
    return requiredPermission ? hasPermission(requiredPermission) : true;
  };

  // Handle pre-selected class from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedClass && Object.keys(reportClasses).includes(state.selectedClass) && hasClassPermission(state.selectedClass)) {
      setSelectedClass(state.selectedClass);
      // Clear the state to prevent re-setting on future navigations
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, location.search]);

  // Load form after clicking report
  const handleReportClick = async (report: string) => {
    setSelectedReport(report);
    setLoadedForm(null);

    try {
      const module = await formLoader(
        selectedClass.toLowerCase().replace(/ /g, ""),
        report.replace(/ /g, "")
      );
      setLoadedForm(() => module.default);
    } catch (error) {
      console.error("Form load failed", error);
      setLoadedForm(() => null);
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Reports" },
  ];

  return (
    <FormPageLayout>
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="Reports" />
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>
      {/* 3-Column Layout */}
      <Grid container spacing={2}>
        {/*  Left Column — Report Classes */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "var(--pallet-dark-blue)",
              }}
            >
              Report Classes
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <List>
              {Object.keys(reportClasses).map((cls) => {
                const hasPermission = hasClassPermission(cls);
                return (
                  <ListItemButton
                    key={cls}
                    selected={selectedClass === cls}
                    disabled={!hasPermission}
                    onClick={() => {
                      if (hasPermission) {
                        setSelectedClass(cls);
                        setSelectedReport("");
                        setLoadedForm(null);
                      }
                    }}
                    sx={{
                      borderRadius: 1,
                      "&.Mui-selected": {
                        backgroundColor: "var(--pallet-light-blue)",
                      },
                      "&.Mui-disabled": {
                        opacity: 0.6,
                        color: "text.disabled",
                      },
                    }}
                  >
                    <ListItemText primary={cls} />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/*  Middle Column — Reports for Class */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, minHeight: "450px" }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "var(--pallet-dark-blue)",
              }}
            >
              Reports For Class: {selectedClass || "-"}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {selectedClass ? (
              <List>
                {reportClasses[selectedClass].map((report) => (
                  <ListItemButton
                    key={report}
                    selected={selectedReport === report}
                    onClick={() => handleReportClick(report)}
                    sx={{
                      borderRadius: 1,
                      "&.Mui-selected": {
                        backgroundColor: "var(--pallet-light-blue)",
                      },
                    }}
                  >
                    <ListItemText primary={report} />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                Select a report class to view reports.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/*  Right Column — Loaded Dynamic Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, minHeight: "450px" }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "var(--pallet-dark-blue)",
              }}
            >
              {selectedReport || "Report Form"}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {LoadedForm && selectedReport ? (
              <ReportGenerationProvider
                reportKey={reportKeyFromTitle(selectedReport)}
                reportTitle={selectedReport}
              >
                <LoadedForm />
              </ReportGenerationProvider>
            ) : selectedReport ? (
              <Typography color="text.secondary">
                Loading form for "{selectedReport}"...
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Select a report to load its form.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </FormPageLayout>
  );
}
