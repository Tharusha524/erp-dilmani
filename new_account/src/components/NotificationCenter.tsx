import React, { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useNavigate } from "react-router";
import { useNotificationStore, type NotificationKind } from "../store/notificationStore";
import { useDashboardAlerts } from "../hooks/useDashboardAlerts";
import { getDashboardAlertRoute } from "../utils/dashboardAlertRoutes";
import type { DashboardAlert } from "../api/Dashboard/DashboardApi";

const kindIcon: Record<NotificationKind, React.ReactNode> = {
  success: <CheckCircleOutlineIcon fontSize="small" color="success" />,
  error: <ErrorOutlineIcon fontSize="small" color="error" />,
  warning: <WarningAmberIcon fontSize="small" color="warning" />,
  info: <InfoOutlinedIcon fontSize="small" color="info" />,
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AlertRow({
  alert,
  onNavigate,
}: {
  alert: DashboardAlert;
  onNavigate: (path: string) => void;
}) {
  const path = getDashboardAlertRoute(alert);
  const isWarning = alert.severity === "warning";

  const content = (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      {isWarning ? (
        <WarningAmberIcon sx={{ fontSize: 18, color: "#d97706", mt: 0.15 }} />
      ) : (
        <ScheduleIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.15 }} />
      )}
      <Typography variant="body2" fontWeight={500} color="#334155">
        {alert.label}
      </Typography>
    </Stack>
  );

  if (!path) {
    return (
      <Box
        sx={{
          p: 1.25,
          borderRadius: 1.5,
          bgcolor: "#fff",
          border: "1px solid",
          borderColor: isWarning ? alpha("#f59e0b", 0.35) : alpha("#3b82f6", 0.25),
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <ListItemButton
      onClick={() => onNavigate(path)}
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: isWarning ? alpha("#f59e0b", 0.35) : alpha("#3b82f6", 0.25),
        "&:hover": { bgcolor: alpha("#fef3c7", 0.35) },
      }}
    >
      {content}
    </ListItemButton>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { items, unreadCount, markAllRead, clear } = useNotificationStore();
  const { data: alerts = [], isLoading: alertsLoading } = useDashboardAlerts();

  const open = Boolean(anchor);

  const badgeCount = useMemo(
    () => alerts.length + unreadCount,
    [alerts.length, unreadCount]
  );

  const handleNavigate = (path: string) => {
    setAnchor(null);
    navigate(path);
  };

  return (
    <>
      <IconButton
        aria-label="Notifications"
        size="small"
        className="erp-navbar__icon-btn"
        onClick={(e) => {
          setAnchor(e.currentTarget);
          markAllRead();
        }}
      >
        <Badge badgeContent={badgeCount > 0 ? badgeCount : undefined} color="error" max={99}>
          <NotificationsNoneOutlinedIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 380, maxWidth: "95vw", maxHeight: 520 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Alerts & Notifications
          </Typography>
          {items.length > 0 && (
            <Button size="small" onClick={clear}>
              Clear activity
            </Button>
          )}
        </Box>
        <Divider />

        <Box sx={{ px: 2, py: 1.5, bgcolor: alpha("#fef3c7", 0.35) }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <WarningAmberIcon sx={{ color: "#d97706", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Alerts & Reminders
            </Typography>
          </Stack>

          {alertsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : alerts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
              No alerts — everything looks good.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {alerts.map((alert) => (
                <AlertRow key={`${alert.type ?? "alert"}-${alert.label}`} alert={alert} onNavigate={handleNavigate} />
              ))}
            </Stack>
          )}
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            Recent activity
          </Typography>
        </Box>

        {items.length === 0 ? (
          <Typography sx={{ px: 2, pb: 2, color: "text.secondary", fontSize: 13 }}>
            Save, login, and error toasts appear here.
          </Typography>
        ) : (
          <List dense sx={{ overflowY: "auto", maxHeight: 220, py: 0 }}>
            {items.map((item) => (
              <ListItem
                key={item.id}
                alignItems="flex-start"
                sx={{
                  bgcolor: item.read ? "transparent" : "action.hover",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ mr: 1, mt: 0.3 }}>{kindIcon[item.kind]}</Box>
                <ListItemText
                  primary={item.title ?? item.message}
                  secondary={
                    item.title ? (
                      <>
                        <Typography component="span" variant="body2" display="block">
                          {item.message}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatTime(item.createdAt)}
                        </Typography>
                      </>
                    ) : (
                      formatTime(item.createdAt)
                    )
                  }
                  primaryTypographyProps={{ fontSize: 13, fontWeight: item.read ? 400 : 600 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
