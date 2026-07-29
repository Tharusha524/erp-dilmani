import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PaidIcon from "@mui/icons-material/Paid";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import StatCard from "../../components/StatCard";
import CompanyDocumentHeader from "../../components/CompanyDocumentHeader";
import { getWorkOrders, WorkOrderListItem } from "../../api/WorkOrder/workOrderApi";
import { formatWoAmount, formatWoQuantity } from "../../utils/workOrderNumberFormat";
import { downloadElementAsPdf, sanitizePdfFilename } from "../../utils/downloadTransactionPrintPdf";
import "../../styles/workOrderReportPrint.css";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";

const CATEGORY_LABELS: Record<string, string> = {
  sublimation_tshirt: "Sublimation T-Shirt",
  polo_tshirt: "Polo T-Shirt",
  printing_job: "Printing Job",
  embroidery_job: "Embroidery Job",
};

type Period = "daily" | "weekly" | "monthly" | "yearly";
type OrderState = "all" | "closed" | "verified" | "handed_over";

const periodRange = (period: Period, anchor: Date): { start: Date; end: Date } => {
  switch (period) {
    case "daily":
      return { start: anchor, end: anchor };
    case "weekly":
      return { start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) };
    case "monthly":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case "yearly":
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
  }
};

const shiftAnchor = (period: Period, anchor: Date, direction: 1 | -1): Date => {
  switch (period) {
    case "daily":
      return addDays(anchor, direction);
    case "weekly":
      return addWeeks(anchor, direction);
    case "monthly":
      return addMonths(anchor, direction);
    case "yearly":
      return addYears(anchor, direction);
  }
};

const periodLabel = (period: Period, start: Date, end: Date): string => {
  switch (period) {
    case "daily":
      return format(start, "EEEE, d MMM yyyy");
    case "weekly":
      return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
    case "monthly":
      return format(start, "MMMM yyyy");
    case "yearly":
      return format(start, "yyyy");
  }
};

const toDateOnly = (d: Date) => format(d, "yyyy-MM-dd");

export default function WorkOrderReport() {
  const [period, setPeriod] = useState<Period>("daily");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orderStateFilter, setOrderStateFilter] = useState<OrderState>("all");
  const printAreaRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["wo-sheet-orders"],
    queryFn: getWorkOrders,
  });

  const { start, end } = useMemo(() => periodRange(period, anchor), [period, anchor]);

  const ordersInPeriod = useMemo(() => {
    const startKey = toDateOnly(start);
    const endKey = toDateOnly(end);
    return workOrders.filter((wo) => {
      const key = (wo.order_date || wo.created_at)?.slice(0, 10);
      return !!key && key >= startKey && key <= endKey;
    });
  }, [workOrders, start, end]);

  const statusOptions = useMemo(() => {
    const names = new Set<string>();
    workOrders.forEach((wo) => {
      if (wo.status_name) names.add(wo.status_name);
    });
    return Array.from(names).sort();
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    return ordersInPeriod.filter((wo) => {
      if (statusFilter && wo.status_name !== statusFilter) return false;
      if (orderStateFilter === "closed" && !wo.is_finished) return false;
      if (orderStateFilter === "verified" && !wo.is_verified) return false;
      if (orderStateFilter === "handed_over" && !wo.is_handed_over) return false;
      return true;
    });
  }, [ordersInPeriod, statusFilter, orderStateFilter]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalQuantity = filteredOrders.reduce((sum, wo) => sum + (wo.order_quantity || 0), 0);
    const totalRevenue = filteredOrders.reduce((sum, wo) => sum + (Number(wo.total_price) || 0), 0);
    // An order only counts as "Completed" once someone has clicked Hand Over.
    const completed = filteredOrders.filter((wo) => wo.is_handed_over).length;
    return { totalOrders, totalQuantity, totalRevenue, completed };
  }, [filteredOrders]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const filename = sanitizePdfFilename(
        `Work_Order_Report_${period}_${toDateOnly(start)}_to_${toDateOnly(end)}`
      );
      // Company header is hidden on screen — show it just for the capture.
      if (headerRef.current) headerRef.current.style.display = "block";
      await downloadElementAsPdf(printAreaRef.current, filename);
    } catch {
      enqueueSnackbar("Failed to generate PDF", { variant: "error" });
    } finally {
      if (headerRef.current) headerRef.current.style.display = "";
      setIsDownloadingPdf(false);
    }
  };

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          className="no-print"
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Work Order Report
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? "Generating..." : "Download PDF"}
            </Button>
          </Stack>
        </Stack>

        <Tabs
          value={period}
          onChange={(_, value: Period) => setPeriod(value)}
          className="no-print"
          sx={{ mb: 2, borderBottom: "1px solid var(--pallet-border-blue)" }}
        >
          <Tab label="Daily" value="daily" />
          <Tab label="Weekly" value="weekly" />
          <Tab label="Monthly" value="monthly" />
          <Tab label="Yearly" value="yearly" />
        </Tabs>

        <Paper
          variant="outlined"
          className="no-print"
          sx={{
            p: 1.5,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={() => setAnchor((prev) => shiftAnchor(period, prev, -1))}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 200, textAlign: "center" }}>
              {periodLabel(period, start, end)}
            </Typography>
            <IconButton size="small" onClick={() => setAnchor((prev) => shiftAnchor(period, prev, 1))}>
              <ChevronRightIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              type="date"
              size="small"
              value={toDateOnly(anchor)}
              onChange={(e) => e.target.value && setAnchor(new Date(`${e.target.value}T00:00:00`))}
            />
            <IconButton size="small" onClick={() => setAnchor(new Date())} title="Jump to today">
              <TodayIcon />
            </IconButton>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          className="no-print"
          sx={{ p: 1.5, mb: 2, display: "flex", flexWrap: "wrap", gap: 1.5 }}
        >
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statusOptions.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Order State"
            value={orderStateFilter}
            onChange={(e) => setOrderStateFilter(e.target.value as OrderState)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="closed">Closed (Finished)</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="handed_over">Handed Over (Completed)</MenuItem>
          </TextField>
        </Paper>

        <Box ref={printAreaRef} className="wo-report-print-area">
        <Box ref={headerRef} sx={{ display: "none", "@media print": { display: "block" } }}>
          <CompanyDocumentHeader compact />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ my: 1.5 }}>
          Work Order Report — {periodLabel(period, start, end)}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Orders" value={stats.totalOrders} change={0} icon={<AssignmentIcon />} iconColor="#1976d2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Quantity" value={formatWoQuantity(stats.totalQuantity)} change={0} icon={<Inventory2Icon />} iconColor="#f59e0b" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={stats.totalRevenue.toLocaleString(undefined, { style: "currency", currency: "LKR" })}
              change={0}
              icon={<PaidIcon />}
              iconColor="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Completed" value={stats.completed} change={0} icon={<CheckCircleOutlineIcon />} iconColor="#7b1fa2" />
          </Grid>
        </Grid>

        <Card elevation={0} variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Work Orders in this period
            </Typography>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>WO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Order Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No work orders match this filter.</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((wo: WorkOrderListItem) => (
                      <TableRow key={wo.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{wo.work_order_no}</TableCell>
                        <TableCell>{wo.order_date ? format(new Date(wo.order_date), "d MMM yyyy") : "-"}</TableCell>
                        <TableCell>{wo.customer || "-"}</TableCell>
                        <TableCell>{wo.branch || "-"}</TableCell>
                        <TableCell>{CATEGORY_LABELS[wo.category] || wo.category}</TableCell>
                        <TableCell align="right">{formatWoQuantity(wo.order_quantity)}</TableCell>
                        <TableCell align="right">{formatWoAmount(wo.total_price)}</TableCell>
                        <TableCell>
                          <Chip label={wo.status_name || "-"} size="small" color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        </Box>
      </Box>
    </FormPageLayout>
  );
}
