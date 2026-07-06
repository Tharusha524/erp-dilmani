import React from "react";
import { Box, Stack, Typography, alpha } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { DashboardAlert } from "../../api/Dashboard/DashboardApi";
import { getDashboardAlertRoute } from "../../utils/dashboardAlertRoutes";

interface Props {
  alerts: DashboardAlert[];
  onNavigate: (path: string) => void;
  compact?: boolean;
}

export default function DashboardAlertList({ alerts, onNavigate, compact }: Props) {
  if (alerts.length === 0) return null;

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      {alerts.map((alert) => {
        const path = getDashboardAlertRoute(alert);
        const isWarning = alert.severity === "warning";

        const inner = (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
              {isWarning ? (
                <WarningAmberIcon sx={{ fontSize: 18, color: "#d97706", mt: 0.15, flexShrink: 0 }} />
              ) : (
                <ScheduleIcon sx={{ fontSize: 18, color: "#024271", mt: 0.15, flexShrink: 0 }} />
              )}
              <Typography variant="body2" fontWeight={500} color="#334155">
                {alert.label}
              </Typography>
            </Stack>
            {path && (
              <ArrowForwardIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
            )}
          </Stack>
        );

        if (!path) {
          return (
            <Box
              key={`${alert.type ?? "alert"}-${alert.label}`}
              className="erp-dashboard__alert-item"
              sx={{
                borderColor: isWarning ? alpha("#f59e0b", 0.35) : alpha("#024271", 0.2),
                py: compact ? 1 : 1.5,
                px: compact ? 1.25 : 1.5,
              }}
            >
              {inner}
            </Box>
          );
        }

        return (
          <Box
            key={`${alert.type ?? "alert"}-${alert.label}`}
            component="button"
            type="button"
            className="erp-dashboard__alert-item erp-dashboard__alert-item--clickable"
            onClick={() => onNavigate(path)}
            sx={{
              borderColor: isWarning ? alpha("#f59e0b", 0.35) : alpha("#024271", 0.2),
              py: compact ? 1 : 1.5,
              px: compact ? 1.25 : 1.5,
              width: "100%",
              textAlign: "left",
            }}
          >
            {inner}
          </Box>
        );
      })}
    </Stack>
  );
}
