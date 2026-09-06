import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Grid, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, TextField, Stack, Chip, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import {
  getSupermarketDashboardSummary, getProductPerformance, getSalesTrend, getTopCustomers,
} from "../../../api/Pos/posApi";
import { getBestSuppliers } from "../../../api/Pos/posApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";

// Same brand-neutral, colorblind-safe palette across every chart on this
// page so series read as one consistent system.
const CHART_COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

export default function SalesAnalyticsPage() {
  const { formatCurrency } = useHomeCurrency();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["supermarket-dashboard-summary"],
    queryFn: getSupermarketDashboardSummary,
  });

  const { data: perf, isLoading: loadingPerf } = useQuery({
    queryKey: ["product-performance", fromDate, toDate],
    queryFn: () => getProductPerformance({ from_date: fromDate, to_date: toDate }),
  });

  const [trendGroupBy, setTrendGroupBy] = useState<"day" | "month">("day");
  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ["sales-trend", fromDate, toDate, trendGroupBy],
    queryFn: () => getSalesTrend({ from_date: fromDate, to_date: toDate, group_by: trendGroupBy }),
  });

  const { data: topCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["top-customers"],
    queryFn: () => getTopCustomers(10),
  });

  const { data: bestSuppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["best-suppliers"],
    queryFn: () => getBestSuppliers(),
  });

  if (loadingSummary) return <PageLoader />;

  const kpis = [
    { label: "Today's Sales", value: formatCurrency(summary?.today_sales ?? 0), color: "success" as const, icon: <PaidIcon fontSize="small" /> },
    { label: "Bills Issued Today", value: summary?.bills_issued_today ?? 0, color: "info" as const, icon: <ReceiptLongIcon fontSize="small" /> },
    { label: "Debtors Outstanding", value: formatCurrency(summary?.total_debtors_outstanding ?? 0), color: "warning" as const, icon: <AccountBalanceWalletIcon fontSize="small" /> },
    { label: "Creditors Payable", value: formatCurrency(summary?.total_creditors_payable ?? 0), color: "secondary" as const, icon: <PaymentsIcon fontSize="small" /> },
    { label: "Low Stock Items", value: summary?.low_stock_count ?? 0, color: "error" as const, icon: <WarningAmberIcon fontSize="small" /> },
  ];

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Sales Analytics" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Sales Analytics" }]} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((k) => (
          <Grid item xs={12} sm={6} md={2.4} key={k.label}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid", borderColor: "divider", borderRadius: 3,
                borderLeft: "4px solid", borderLeftColor: `${k.color}.main`,
                bgcolor: (theme) => alpha(theme.palette[k.color].main, theme.palette.mode === "dark" ? 0.16 : 0.08),
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Box sx={{ color: `${k.color}.main`, display: "flex" }}>{k.icon}</Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    {k.label}
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ color: `${k.color}.dark` }}>{k.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="From" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "primary.main" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Sales Trend</Typography>
                <ToggleButtonGroup
                  size="small" exclusive value={trendGroupBy}
                  onChange={(_, v) => v && setTrendGroupBy(v)}
                >
                  <ToggleButton value="day">Daily</ToggleButton>
                  <ToggleButton value="month">Monthly</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              {loadingTrend ? <PageLoader /> : (trend ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No sales in this period
                </Typography>
              ) : (
                <LineChart
                  height={280}
                  xAxis={[{ scaleType: "point", data: (trend ?? []).map((r: any) => r.period), label: "Date" }]}
                  series={[{ data: (trend ?? []).map((r: any) => Number(r.total_sales) || 0), label: "Sales", color: CHART_COLORS[0], curve: "linear", showMark: true }]}
                  margin={{ left: 70, right: 20, top: 20, bottom: 40 }}
                  slots={{ legend: () => null }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "success.main" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Top 8 Products by Revenue</Typography>
              {loadingPerf ? <PageLoader /> : (perf?.best_selling ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No sales in this period
                </Typography>
              ) : (
                <BarChart
                  height={280}
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: (perf?.best_selling ?? []).slice(0, 8).map((r: any) => r.description) }]}
                  series={[{ data: (perf?.best_selling ?? []).slice(0, 8).map((r: any) => Number(r.revenue) || 0), label: "Revenue", color: CHART_COLORS[1] }]}
                  margin={{ left: 120, right: 20, top: 20, bottom: 30 }}
                  slots={{ legend: () => null }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "info.main" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Best-Selling Products</Typography>
              {loadingPerf ? <PageLoader /> : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty Sold</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(perf?.best_selling ?? []).map((row: any) => (
                        <TableRow key={row.stock_id}>
                          <TableCell>{row.description}</TableCell>
                          <TableCell align="right">{row.qty_sold}</TableCell>
                          <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      {(!perf?.best_selling || perf.best_selling.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">No sales in this period</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "warning.main" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Slow-Selling Products</Typography>
              {loadingPerf ? <PageLoader /> : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty Sold</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(perf?.slow_selling ?? []).map((row: any) => (
                        <TableRow key={row.stock_id}>
                          <TableCell>{row.description}</TableCell>
                          <TableCell align="right">{row.qty_sold}</TableCell>
                          <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      {(!perf?.slow_selling || perf.slow_selling.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">No sales in this period</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "secondary.main" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Top Customers</Typography>
              {loadingCustomers ? <PageLoader /> : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Customer</TableCell><TableCell align="right">Invoices</TableCell><TableCell align="right">Total Spend</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(topCustomers ?? []).map((row: any) => (
                        <TableRow key={row.debtor_no}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell align="right">{row.invoice_count}</TableCell>
                          <TableCell align="right">{formatCurrency(row.total_spend)}</TableCell>
                        </TableRow>
                      ))}
                      {(!topCustomers || topCustomers.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, borderTop: "3px solid", borderTopColor: "error.main" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Best Suppliers</Typography>
              {loadingSuppliers ? <PageLoader /> : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Supplier</TableCell><TableCell align="right">Invoices</TableCell><TableCell align="right">Total Value</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(bestSuppliers ?? []).map((row: any) => (
                        <TableRow key={row.supplier_id}>
                          <TableCell>{row.supp_name}</TableCell>
                          <TableCell align="right">{row.invoice_count}</TableCell>
                          <TableCell align="right">{formatCurrency(row.total_purchase_value)}</TableCell>
                        </TableRow>
                      ))}
                      {(!bestSuppliers || bestSuppliers.length === 0) && (
                        <TableRow><TableCell colSpan={3} align="center">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </FormPageLayout>
  );
}
