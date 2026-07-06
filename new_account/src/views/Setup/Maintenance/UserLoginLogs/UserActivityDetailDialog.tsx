import React from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ComputerIcon from "@mui/icons-material/Computer";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  ActivityDetailResponse,
  UserActivityLogRow,
  activityTypeColor,
  activityTypeLabel,
} from "../../../../api/UserLoginLog/UserActivityLogApi";

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value ?? "—"}</Typography>
    </Grid>
  );
}

function ActivityTimelineItem({ item }: { item: UserActivityLogRow }) {
  return (
    <Box
      sx={{
        borderLeft: "3px solid",
        borderColor: item.success ? "primary.main" : "error.main",
        pl: 2,
        py: 1,
        mb: 1,
        bgcolor: "action.hover",
        borderRadius: 1,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          {item.occurred_at ? new Date(item.occurred_at).toLocaleTimeString() : ""}
        </Typography>
        <Chip
          size="small"
          label={activityTypeLabel(item.activity_type)}
          color={activityTypeColor(item.activity_type)}
        />
        {item.module && <Chip size="small" variant="outlined" label={item.module} />}
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {item.description || "—"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        IP: {item.ip_address || "—"} · {item.location_summary || "Unknown location"}
      </Typography>
    </Box>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  detail?: ActivityDetailResponse | null;
}

export default function UserActivityDetailDialog({ open, onClose, loading, detail }: Props) {
  const activity = detail?.activity;
  const daily = detail?.daily;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        User Activity Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>Loading details...</Typography>
        ) : !activity ? (
          <Typography color="text.secondary">No activity selected.</Typography>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  label={activityTypeLabel(activity.activity_type)}
                  color={activityTypeColor(activity.activity_type)}
                />
                <Chip
                  size="small"
                  label={activity.success ? "Success" : "Failed"}
                  color={activity.success ? "success" : "error"}
                />
              </Stack>
              <Typography variant="h6">{activity.full_name || activity.email || "Unknown user"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {activity.occurred_at ? new Date(activity.occurred_at).toLocaleString() : ""}
              </Typography>
            </Box>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <LocationOnIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1">IP & Location</Typography>
              </Stack>
              <Grid container spacing={2}>
                <DetailRow label="IP Address" value={activity.ip_address} />
                <DetailRow label="Location" value={activity.location_summary} />
                <DetailRow label="Country" value={activity.ip_country} />
                <DetailRow label="Region / State" value={activity.ip_region} />
                <DetailRow label="City" value={activity.ip_city} />
                <DetailRow label="ISP / Network" value={activity.ip_isp} />
              </Grid>
            </Box>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ComputerIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1">Device</Typography>
              </Stack>
              <Grid container spacing={2}>
                <DetailRow label="Device" value={activity.device_summary} />
                <DetailRow label="Browser" value={activity.browser} />
                <DetailRow label="Platform" value={activity.platform} />
                <DetailRow label="Role" value={activity.user_role} />
                <DetailRow label="Email" value={activity.email} />
              </Grid>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Action Details
              </Typography>
              <Grid container spacing={2}>
                <DetailRow label="Module" value={activity.module} />
                <DetailRow label="Record ID" value={activity.entity_id} />
                <DetailRow label="HTTP Method" value={activity.http_method} />
                <DetailRow label="Route" value={activity.route} />
                <DetailRow label="Status Code" value={activity.http_status} />
                <Grid item xs={12}>
                  <DetailRow label="Description" value={activity.description} />
                </Grid>
              </Grid>
            </Box>

            {daily && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TimelineIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle1">
                    Daily Activity — {new Date(daily.date).toLocaleDateString()}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip size="small" label={`Logins: ${daily.summary.logins}`} />
                  <Chip size="small" color="primary" label={`Created: ${daily.summary.creates}`} />
                  <Chip size="small" color="info" label={`Updated: ${daily.summary.updates}`} />
                  <Chip size="small" color="error" label={`Deleted: ${daily.summary.deletes}`} />
                  <Chip size="small" label={`Posted: ${daily.summary.posts}`} />
                  <Chip size="small" label={`Voided: ${daily.summary.voids}`} />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {daily.activities.length === 0 ? (
                  <Typography color="text.secondary">No other activity recorded for this day.</Typography>
                ) : (
                  daily.activities.map((item) => <ActivityTimelineItem key={item.id} item={item} />)
                )}
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
