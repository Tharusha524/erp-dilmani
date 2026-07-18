import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  MenuItem,
  Chip,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import {
  DailyOverviewUser,
  UserActivityLogRow,
  activityTypeColor,
  activityTypeLabel,
  getDailyActivityOverview,
  getUserActivityDetail,
  getUserActivityLogs,
} from "../../../../api/UserLoginLog/UserActivityLogApi";
import { getUsers } from "../../../../api/UserManagement/userManagement";
import UserActivityDetailDialog from "./UserActivityDetailDialog";
import UserActivityDayDialog from "./UserActivityDayDialog";

interface AccountUserOption {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: "", label: "All activities" },
  { value: "login", label: "Login" },
  { value: "login_failed", label: "Failed login" },
  { value: "login_blocked_ip", label: "Blocked IP login" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "post", label: "Post" },
  { value: "void", label: "Void" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "Admin", label: "Admin" },
  { value: "User", label: "User" },
];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function SummaryBar({ summary }: { summary: { logins: number; creates: number; updates: number; deletes: number; posts: number; voids: number } }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip icon={<TodayIcon />} size="small" label={`Logins: ${summary.logins}`} />
      <Chip size="small" color="primary" label={`Created: ${summary.creates}`} />
      <Chip size="small" color="info" label={`Updated: ${summary.updates}`} />
      <Chip size="small" color="error" label={`Deleted: ${summary.deletes}`} />
      <Chip size="small" label={`Posted: ${summary.posts}`} />
      <Chip size="small" label={`Voided: ${summary.voids}`} />
    </Stack>
  );
}

export default function UserLoginLogs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [dailyDate, setDailyDate] = useState(todayIso());
  const [dailyUserId, setDailyUserId] = useState("");
  const [dailyRoleFilter, setDailyRoleFilter] = useState("");
  const [dailyActivityType, setDailyActivityType] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [email, setEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activityType, setActivityType] = useState("");
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(todayIso());
  const [successFilter, setSuccessFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchParams, setSearchParams] = useState({
    user_id: "" as string | number,
    email: "",
    role: "",
    activity_type: "",
    fromDate: todayIso(),
    toDate: todayIso(),
    success: "" as string | boolean,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dayUser, setDayUser] = useState<DailyOverviewUser | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const isToday = dailyDate === todayIso();

  const { data: accountUsers = [] } = useQuery<AccountUserOption[]>({
    queryKey: ["user-activity-account-users"],
    queryFn: async () => {
      const data = await getUsers();
      return (data as Array<{ id: number; first_name?: string; last_name?: string; email?: string; role?: string }>)
        .map((user) => ({
          id: user.id,
          fullName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || `User #${user.id}`,
          email: user.email ?? "",
          role: user.role ?? "",
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
  });

  const {
    data: dailyOverview,
    isLoading: dailyLoading,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: [
      "user-activity-daily-overview",
      dailyDate,
      dailyUserId,
      dailyRoleFilter,
      dailyActivityType,
    ],
    queryFn: () =>
      getDailyActivityOverview({
        date: dailyDate,
        user_id: dailyUserId ? Number(dailyUserId) : undefined,
        role: dailyRoleFilter || undefined,
        activity_type: dailyActivityType || undefined,
      }),
    refetchInterval: tab === 0 && isToday && !dailyUserId && !dailyRoleFilter && !dailyActivityType ? 30000 : false,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-activity-logs", searchParams, page, rowsPerPage],
    queryFn: () =>
      getUserActivityLogs({
        user_id: searchParams.user_id ? Number(searchParams.user_id) : undefined,
        email: searchParams.email || undefined,
        role: searchParams.role || undefined,
        activity_type: searchParams.activity_type || undefined,
        fromDate: searchParams.fromDate || undefined,
        toDate: searchParams.toDate || undefined,
        success:
          searchParams.success === ""
            ? undefined
            : searchParams.success === "true",
        page: page + 1,
        per_page: rowsPerPage,
      }),
    enabled: tab === 1,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["user-activity-detail", selectedId],
    queryFn: () => getUserActivityDetail(selectedId as number),
    enabled: detailOpen && selectedId != null,
  });

  const rows = data?.data ?? [];
  const dailyUsers = dailyOverview?.users ?? [];
  const dailyActivities = dailyOverview?.activities ?? [];

  const handleSearchLog = () => {
    setPage(0);
    setSearchParams({
      user_id: userIdFilter,
      email,
      role: roleFilter,
      activity_type: activityType,
      fromDate,
      toDate,
      success: successFilter,
    });
    refetch();
  };

  const clearDailyFilters = () => {
    setDailyUserId("");
    setDailyRoleFilter("");
    setDailyActivityType("");
  };

  const clearLogFilters = () => {
    setUserIdFilter("");
    setEmail("");
    setRoleFilter("");
    setActivityType("");
    setFromDate(todayIso());
    setToDate(todayIso());
    setSuccessFilter("");
    setPage(0);
    setSearchParams({
      user_id: "",
      email: "",
      role: "",
      activity_type: "",
      fromDate: todayIso(),
      toDate: todayIso(),
      success: "",
    });
  };

  const openDetail = (row: UserActivityLogRow) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  const openDayUser = (user: DailyOverviewUser) => {
    setDayUser(user);
    setDayDialogOpen(true);
  };

  return (
    <FormPageLayout>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <PageTitle title="User Login & Daily Activity" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Setup", href: "/setup" },
              { title: "Maintenance", href: "/setup/maintenance" },
              { title: "User Login & Daily Activity" },
            ]}
          />
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Paper sx={{ px: 2, pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Daily Activity" />
          <Tab label="Full Activity Log" />
        </Tabs>
      </Paper>
      {tab === 0 && (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                label="Date"
                type="date"
                size="small"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="User account"
                size="small"
                value={dailyUserId}
                onChange={(e) => setDailyUserId(e.target.value)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">All users</MenuItem>
                {accountUsers.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.fullName} ({user.email})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Role"
                size="small"
                value={dailyRoleFilter}
                onChange={(e) => setDailyRoleFilter(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Activity"
                size="small"
                value={dailyActivityType}
                onChange={(e) => setDailyActivityType(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetchDaily()}>
                Refresh
              </Button>
              <Button variant="text" onClick={clearDailyFilters}>
                Clear filters
              </Button>
              <Button
                variant="text"
                onClick={() => setDailyDate(todayIso())}
                disabled={isToday}
              >
                Go to today
              </Button>
            </Stack>
            {isToday && !dailyUserId && !dailyRoleFilter && !dailyActivityType && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Auto-refreshes every 30 seconds while viewing today with no filters.
              </Typography>
            )}
          </Paper>

          {dailyOverview && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Day summary — {dailyOverview.total} action{dailyOverview.total === 1 ? "" : "s"}
              </Typography>
              <SummaryBar summary={dailyOverview.summary} />
            </Paper>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            Each login, create, edit, delete, and post is recorded for the selected day. Click a user or action to see full details.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Users active on this day
                </Typography>
                {dailyLoading ? (
                  <Typography>Loading...</Typography>
                ) : dailyUsers.length === 0 ? (
                  <Typography color="text.secondary">
                    No activity recorded for this date and filter selection.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {dailyUsers.map((user) => (
                      <Card
                        key={`${user.user_id}-${user.email}`}
                        variant="outlined"
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        onClick={() => openDayUser(user)}
                      >
                        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Typography variant="subtitle1">{user.full_name || user.email}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {user.email} · {user.user_role || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            Last: {user.last_activity_at ? new Date(user.last_activity_at).toLocaleTimeString() : "—"} ·{" "}
                            {user.last_ip || "—"} · {user.last_location || "—"}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <SummaryBar summary={user.summary} />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} lg={7}>
              <TableContainer component={Paper}>
                <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
                  All actions today (timeline)
                </Typography>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell>Module</TableCell>
                      <TableCell>IP / Location</TableCell>
                      <TableCell align="center">View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>Loading...</TableCell>
                      </TableRow>
                    ) : dailyActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography color="text.secondary">No actions for this date.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyActivities.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => openDetail(row)}
                        >
                          <TableCell>
                            {row.occurred_at ? new Date(row.occurred_at).toLocaleTimeString() : ""}
                          </TableCell>
                          <TableCell>{row.full_name || row.email || "—"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={activityTypeLabel(row.activity_type)}
                              color={activityTypeColor(row.activity_type)}
                            />
                          </TableCell>
                          <TableCell>{row.module || "—"}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.ip_address || "—"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.location_summary || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(row);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </>
      )}
      {tab === 1 && (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                select
                label="User account"
                size="small"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">All users</MenuItem>
                {accountUsers.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.fullName} ({user.email})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Email contains"
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ minWidth: 180 }}
                disabled={Boolean(userIdFilter)}
                helperText={userIdFilter ? "Clear user account to search by email" : undefined}
              />
              <TextField
                select
                label="Role"
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Activity"
                size="small"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="From"
                type="date"
                size="small"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Status"
                size="small"
                value={successFilter}
                onChange={(e) => setSuccessFilter(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Success</MenuItem>
                <MenuItem value="false">Failed</MenuItem>
              </TextField>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearchLog}>
                Search
              </Button>
              <Button variant="text" onClick={clearLogFilters}>
                Clear filters
              </Button>
            </Stack>
          </Paper>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
                <TableRow>
                  <TableCell>Date / Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="text.secondary">No matching activity.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => openDetail(row)}
                    >
                      <TableCell>
                        {row.occurred_at ? new Date(row.occurred_at).toLocaleString() : ""}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.full_name || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.email || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={activityTypeLabel(row.activity_type)}
                          color={activityTypeColor(row.activity_type)}
                        />
                      </TableCell>
                      <TableCell>{row.module || "—"}</TableCell>
                      <TableCell>{row.ip_address || "—"}</TableCell>
                      <TableCell>{row.location_summary || "—"}</TableCell>
                      <TableCell>{row.device_summary || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.success ? "Success" : "Failed"}
                          color={row.success ? "success" : "error"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(row);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              count={data?.total ?? 0}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </TableContainer>
        </>
      )}
      <UserActivityDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedId(null);
        }}
        loading={detailLoading}
        detail={detailData ?? null}
      />
      <UserActivityDayDialog
        open={dayDialogOpen}
        onClose={() => {
          setDayDialogOpen(false);
          setDayUser(null);
        }}
        date={dailyDate}
        user={dayUser}
      />
    </FormPageLayout>
  );
}
