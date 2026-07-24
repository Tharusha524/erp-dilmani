import React, { useMemo } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import StatCard from "../../components/StatCard";
import CustomPieChart from "../../components/CustomPieChart";
import { getWorkOrders } from "../../api/WorkOrder/workOrderApi";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
};

const LAST_STATUS_DAY = 10;
const TREND_DAYS = 14;

export default function WorkOrderAnalytics() {
  const { data: workOrders = [] } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });

  const stats = useMemo(() => {
    const total = workOrders.length;
    const completed = workOrders.filter((wo) => wo.status_sequence_order === LAST_STATUS_DAY).length;
    const reopened = workOrders.filter((wo) => !!wo.reopen_datetime).length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = workOrders.filter(
      (wo) => wo.delivery_date && wo.delivery_date.slice(0, 10) < today && wo.status_sequence_order !== LAST_STATUS_DAY
    ).length;
    const inProgress = total - completed;

    const byCategory: Record<string, number> = {};
    const byProcessType: Record<string, number> = { normal: 0, bulk: 0 };
    workOrders.forEach((wo) => {
      byCategory[wo.category] = (byCategory[wo.category] || 0) + 1;
      byProcessType[wo.process_type] = (byProcessType[wo.process_type] || 0) + 1;
    });

    return { total, completed, inProgress, reopened, overdue, byCategory, byProcessType };
  }, [workOrders]);

  const categoryPieData = useMemo(
    () =>
      Object.entries(stats.byCategory).map(([category, count]) => ({
        name: CATEGORY_LABELS[category] || category,
        value: count,
      })),
    [stats.byCategory]
  );

  const trendData = useMemo(() => {
    const days: { key: string; name: string; placed: number; completed: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, name: key.slice(5), placed: 0, completed: 0 });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));

    workOrders.forEach((wo) => {
      const key = wo.created_at?.slice(0, 10);
      if (key && byKey[key]) {
        byKey[key].placed += 1;
        if (wo.status_sequence_order === LAST_STATUS_DAY) {
          byKey[key].completed += 1;
        }
      }
    });

    return days;
  }, [workOrders]);

  return (
    <Box mb={2}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Work Order Analytics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Total Orders" value={stats.total} change={0} icon={<AssignmentIcon />} iconColor="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="In Progress" value={stats.inProgress} change={0} icon={<PendingActionsIcon />} iconColor="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Completed" value={stats.completed} change={0} icon={<CheckCircleOutlineIcon />} iconColor="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Reopened" value={stats.reopened} change={0} icon={<ReplayIcon />} iconColor="#7b1fa2" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Overdue" value={stats.overdue} change={0} icon={<WarningAmberIcon />} iconColor="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Placed vs Completed (last {TREND_DAYS} days)
              </Typography>
              <Box sx={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="placed" name="Placed" stroke="#1976d2" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#2e7d32" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Orders by Category
              </Typography>
              {categoryPieData.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 280 }}>
                  <Typography variant="body2" color="text.secondary">
                    No work orders yet.
                  </Typography>
                </Stack>
              ) : (
                <CustomPieChart data={categoryPieData} width="100%" height={280} innerRadius={60} outerRadius={90} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
