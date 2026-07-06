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
import {
  DailyOverviewUser,
  UserActivityLogRow,
  activityTypeColor,
  activityTypeLabel,
} from "../../../../api/UserLoginLog/UserActivityLogApi";

function SummaryChips({ summary }: { summary: DailyOverviewUser["summary"] }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip size="small" label={`Logins: ${summary.logins}`} />
      <Chip size="small" color="primary" label={`Created: ${summary.creates}`} />
      <Chip size="small" color="info" label={`Updated: ${summary.updates}`} />
      <Chip size="small" color="error" label={`Deleted: ${summary.deletes}`} />
      <Chip size="small" label={`Posted: ${summary.posts}`} />
      <Chip size="small" label={`Voided: ${summary.voids}`} />
    </Stack>
  );
}

function TimelineItem({ item }: { item: UserActivityLogRow }) {
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
        IP: {item.ip_address || "—"} · {item.location_summary || "Unknown"} · {item.device_summary || "—"}
      </Typography>
    </Box>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  user: DailyOverviewUser | null;
}

export default function UserActivityDayDialog({ open, onClose, date, user }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Daily Activity — {user?.full_name || user?.email || "User"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!user ? (
          <Typography color="text.secondary">No user selected.</Typography>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2">{user.email || "—"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body2">{user.user_role || "—"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Last IP
                </Typography>
                <Typography variant="body2">{user.last_ip || "—"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2">{user.last_location || "—"}</Typography>
              </Grid>
            </Grid>

            <SummaryChips summary={user.summary} />

            <Divider />

            <Typography variant="subtitle1">All actions today</Typography>
            {user.activities.length === 0 ? (
              <Typography color="text.secondary">No activity recorded for this day.</Typography>
            ) : (
              user.activities.map((item) => <TimelineItem key={item.id} item={item} />)
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
