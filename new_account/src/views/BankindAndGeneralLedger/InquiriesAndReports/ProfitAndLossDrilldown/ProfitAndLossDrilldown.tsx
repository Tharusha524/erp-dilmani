import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Grid,
  MenuItem,
  Alert,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import api from "../../../../api/apiClient";
import { getFriendlyApiErrorMessage } from "../../../../utils/apiErrorMessage";
import DimensionSelect from "../../../../components/DimensionSelect";
import { useFiscalYearFormDefaults } from "../../../../hooks/useFiscalYearFormDefaults";
import { isProfitAndLossAccount, isProfitAndLossIncomeAccount, isProfitAndLossCostAccount, buildChartGroupMetaMap } from "../../../../utils/trialAccountBalance";
import {
  buildAccountTypeLabelMap,
  buildAccountTypeToClassMap,
  groupRowsByClassAndGroup,
  resolveRowClass,
} from "../../../../utils/trialBalanceGrouping";
import {
  defaultMonthInFiscalYear,
  formatMonthLabel,
  monthDateBounds,
  monthsInFiscalYear,
} from "../../../../utils/monthPeriod";
import { plAchievePercent } from "../../../../utils/accountingDisplay";
import GlHomeCurrencyNotice from "../../../../components/GlHomeCurrencyNotice";
import {
  GlReportMoneyProvider,
  useGlReportMoney,
} from "../../../../hooks/useGlReportMoney";
import type { PlStatement, PlStatementLine, PlSearchResponse } from "../../../../utils/plStatement";
import { resolvePlAccountDrilldown } from "../../../../utils/plAccountDrilldown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

const PL_TABLE_COLS = 6;

type ReportPeriodMode = "monthly" | "custom";

interface PlSearchParams {
  fromDate: string;
  toDate: string;
  compareTo: string;
  dimension: string;
}

function isPlAccountRow(
  accountType: number,
  classId: string,
  chartGroupMeta: Map<number, import("../../../../utils/trialAccountBalance").ChartGroupMeta>
): boolean {
  if (isProfitAndLossAccount(accountType, chartGroupMeta)) {
    return true;
  }
  return classId === "3" || classId === "4" || classId === "5";
}

function resolveSearchDates(
  reportPeriodMode: ReportPeriodMode,
  selectedMonth: string,
  fromDate: string,
  toDate: string
): { fromDate: string; toDate: string } | null {
  if (reportPeriodMode === "monthly" && selectedMonth) {
    const bounds = monthDateBounds(selectedMonth);
    if (bounds) {
      return bounds;
    }
  }
  if (fromDate && toDate) {
    return { fromDate, toDate };
  }
  return null;
}

interface PlRow {
  id: string;
  account: string;
  accountType: number;
  classId: string;
  className: string;
  typeName: string;
  groupAccountName: string;
  period: number;
  compareValue: number;
  achievePercent: string;
}

function achievePercent(period: number, compare: number): string {
  return plAchievePercent(period, compare);
}

function ClassHeader({ className }: { className: string }) {
  return (
    <TableRow sx={{ backgroundColor: "#1565c0", borderTop: "3px solid #0d47a1" }}>
      <TableCell colSpan={PL_TABLE_COLS} sx={{ fontWeight: "bold", fontSize: "1.1em", color: "white", textAlign: "center" }}>
        {className.toUpperCase()}
      </TableCell>
    </TableRow>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <TableRow sx={{ backgroundColor: "#e3f2fd", borderTop: "2px solid #1976d2" }}>
      <TableCell colSpan={PL_TABLE_COLS} sx={{ fontWeight: "bold", fontSize: "1.05em", color: "#1976d2", pl: 3 }}>
        {title.toUpperCase()}
      </TableCell>
    </TableRow>
  );
}

function SubtotalRow({
  label,
  period,
  compareValue,
  bold = false,
}: {
  label: string;
  period: number;
  compareValue: number;
  bold?: boolean;
}) {
  const { formatStatementAmount } = useGlReportMoney();
  const sx = bold
    ? { fontWeight: 700, backgroundColor: "#e8eaf6", color: "#3f51b5" }
    : { fontWeight: 600, backgroundColor: "#f5f5f5" };

  return (
    <TableRow sx={sx}>
      <TableCell colSpan={2} sx={{ pl: bold ? 2 : 4, ...sx }}>
        {label}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatStatementAmount(period)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatStatementAmount(compareValue)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {achievePercent(period, compareValue)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

function sumPlRows(rows: PlRow[]): { period: number; compareValue: number } {
  return rows.reduce(
    (acc, row) => ({
      period: acc.period + row.period,
      compareValue: acc.compareValue + row.compareValue,
    }),
    { period: 0, compareValue: 0 }
  );
}

function StatementSubtotalRow({
  line,
  highlight = false,
}: {
  line: PlStatementLine;
  highlight?: boolean;
}) {
  const { formatStatementAmount } = useGlReportMoney();
  const sx = highlight
    ? { fontWeight: 700, backgroundColor: "#fff3e0", borderTop: "2px solid #333" }
    : line.bold
      ? { fontWeight: 700, backgroundColor: "#e8eaf6", color: "#3f51b5" }
      : { fontWeight: 600, backgroundColor: "#f5f5f5" };

  return (
    <TableRow sx={sx}>
      <TableCell colSpan={2} sx={{ pl: highlight ? 2 : 4, ...sx }}>
        {line.label}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatStatementAmount(line.period ?? 0)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatStatementAmount(line.compareValue ?? 0)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {line.achievePercent ?? achievePercent(line.period ?? 0, line.compareValue ?? 0)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

function formatFyDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function ProfitAndLossDrilldown() {
  return (
    <GlReportMoneyProvider>
      <ProfitAndLossDrilldownPage />
    </GlReportMoneyProvider>
  );
}

function ProfitAndLossDrilldownPage() {
  const { formatStatementAmount, amountColumnLabel } = useGlReportMoney();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportPeriodMode, setReportPeriodMode] = useState<ReportPeriodMode>("custom");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [compareTo, setCompareTo] = useState("Accumulated");
  const [dimension, setDimension] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [dateError, setDateError] = useState("");
  const [searchParams, setSearchParams] = useState<PlSearchParams | null>(null);
  const fyDefaults = useFiscalYearFormDefaults();

  useEffect(() => {
    if (fyDefaults.isLoading || hasSearched) {
      return;
    }
    const month = defaultMonthInFiscalYear(fyDefaults.fiscalYearFrom, fyDefaults.fiscalYearTo);
    setSelectedMonth((prev) => prev || month);
    setFromDate((prev) => prev || fyDefaults.fiscalYearFrom || fyDefaults.startDate);
    setToDate((prev) => prev || fyDefaults.fiscalYearTo || fyDefaults.endDate);
  }, [
    fyDefaults.isLoading,
    fyDefaults.startDate,
    fyDefaults.endDate,
    fyDefaults.fiscalYearFrom,
    fyDefaults.fiscalYearTo,
    hasSearched,
  ]);

  const monthOptions = useMemo(
    () => monthsInFiscalYear(fyDefaults.fiscalYearFrom, fyDefaults.fiscalYearTo),
    [fyDefaults.fiscalYearFrom, fyDefaults.fiscalYearTo]
  );

  useEffect(() => {
    if (reportPeriodMode !== "monthly" || !selectedMonth) {
      return;
    }
    const bounds = monthDateBounds(selectedMonth);
    if (!bounds) {
      return;
    }
    setFromDate(bounds.fromDate);
    setToDate(bounds.toDate);
  }, [reportPeriodMode, selectedMonth]);

  const { data: chartClasses = [] } = useQuery({
    queryKey: ["chartClasses"],
    queryFn: () => import("../../../../api/GLAccounts/ChartClassApi").then((m) => m.getChartClasses()),
  });

  const { data: chartTypes = [] } = useQuery({
    queryKey: ["chartTypes"],
    queryFn: () => import("../../../../api/GLAccounts/ChartTypeApi").then((m) => m.getChartTypes()),
  });

  const { data: chartMasters = [] } = useQuery({
    queryKey: ["chartMasters"],
    queryFn: () => import("../../../../api/GLAccounts/ChartMasterApi").then((m) => m.getChartMasters()),
  });

  const chartByCode = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    (chartMasters as Record<string, unknown>[]).forEach((row) => {
      const code = String(row.account_code ?? "").trim();
      if (code) {
        map.set(code, row);
      }
    });
    return map;
  }, [chartMasters]);

  const accountTypeMap = useMemo(
    () => buildAccountTypeToClassMap(chartTypes as any[], chartClasses as any[]),
    [chartTypes, chartClasses]
  );

  const accountTypeLabelMap = useMemo(() => buildAccountTypeLabelMap(chartTypes as any[]), [chartTypes]);

  const chartGroupMeta = useMemo(
    () => buildChartGroupMetaMap(chartTypes as any[], chartClasses as any[]),
    [chartTypes, chartClasses]
  );

  const compareToOptions = [
    { value: "Accumulated", label: "Accumulated" },
    { value: "Period Y-1", label: "Period Y-1" },
  ];

  const { data: plData, isLoading, isError, error } = useQuery({
    queryKey: ["profitAndLoss", searchParams],
    queryFn: async (): Promise<PlSearchResponse> => {
      if (!searchParams) {
        return { rows: [] };
      }
      const response = await api.post(
        "/profit-loss/search",
        {
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          compareTo: searchParams.compareTo,
          dimension: searchParams.dimension,
          syncGl: true,
        },
        { skipErrorDialog: true } as Record<string, unknown>
      );
      const payload = response.data;
      if (Array.isArray(payload)) {
        return { rows: payload };
      }
      return {
        rows: payload?.rows || [],
        statement: payload?.statement,
      };
    },
    enabled: !!searchParams,
  });

  const apiRows = plData?.rows ?? [];
  const statement = plData?.statement;

  const handleShow = () => {
    const dates = resolveSearchDates(reportPeriodMode, selectedMonth, fromDate, toDate);
    if (!dates) {
      setDateError("From and To dates are required.");
      setHasSearched(false);
      setSearchParams(null);
      return;
    }
    if (dates.fromDate > dates.toDate) {
      setDateError("From date cannot be after To date.");
      setHasSearched(false);
      setSearchParams(null);
      return;
    }

    setFromDate(dates.fromDate);
    setToDate(dates.toDate);
    setDateError("");
    setHasSearched(true);
    setSearchParams({
      fromDate: dates.fromDate,
      toDate: dates.toDate,
      compareTo,
      dimension,
    });
  };

  const plRows = useMemo((): PlRow[] => {
    return (apiRows as Record<string, unknown>[])
      .map((item, index) => {
        const accountType = Number(item.account_type ?? 0);
        const apiClassId = String(item.classId ?? item.class_id ?? "").trim();
        if (!isPlAccountRow(accountType, apiClassId, chartGroupMeta)) {
          return null;
        }

        const period = Number(item.period ?? 0);
        const compareValue = Number(item.compareValue ?? 0);
        if (Math.abs(period) < 0.001 && Math.abs(compareValue) < 0.001) {
          return null;
        }

        const rowLike = {
          account: String(item.account_code ?? ""),
          accountType,
          classId: apiClassId,
          className: String(item.className ?? item.class ?? ""),
          typeName: String(item.typeName ?? item.type ?? ""),
        };
        const classInfo = resolveRowClass(rowLike, accountTypeMap, chartClasses as any[]);

        return {
          id: String(item.account_code ?? index + 1),
          account: rowLike.account,
          accountType,
          classId: String(classInfo.classId || apiClassId),
          className: classInfo.className || rowLike.className,
          typeName: rowLike.typeName || accountTypeLabelMap[String(accountType)] || "Unknown",
          groupAccountName: String(item.groupAccountName ?? item.account_name ?? ""),
          period,
          compareValue,
          achievePercent: String(item.achievePercent ?? achievePercent(period, compareValue)),
        };
      })
      .filter((row): row is PlRow => row !== null);
  }, [apiRows, accountTypeMap, accountTypeLabelMap, chartClasses, chartGroupMeta]);

  const grouped = useMemo(
    () =>
      groupRowsByClassAndGroup<PlRow>(
        plRows,
        chartClasses as any[],
        accountTypeMap,
        accountTypeLabelMap
      ),
    [plRows, chartClasses, accountTypeMap, accountTypeLabelMap]
  );

  const classOrder = useMemo(() => {
    const fromChart = (chartClasses as any[])
      .map((c) => String(c.class_name ?? c.name ?? ""))
      .filter(Boolean);
    const fromData = Object.keys(grouped);
    return [...new Set([...fromChart, ...fromData])].filter((name) => grouped[name]);
  }, [chartClasses, grouped]);

  const incomeClasses = useMemo(
    () =>
      classOrder.filter((className) => {
        const rows = Object.values(grouped[className] ?? {}).flat();
        return rows.some((row) => isProfitAndLossIncomeAccount(row.accountType, chartGroupMeta));
      }),
    [classOrder, grouped, chartGroupMeta]
  );
  const costClasses = useMemo(
    () =>
      classOrder.filter((className) => {
        const rows = Object.values(grouped[className] ?? {}).flat();
        return rows.some((row) => isProfitAndLossCostAccount(row.accountType, chartGroupMeta));
      }),
    [classOrder, grouped, chartGroupMeta]
  );
  const otherClasses = useMemo(
    () =>
      classOrder.filter(
        (name) => !incomeClasses.includes(name) && !costClasses.includes(name)
      ),
    [classOrder, incomeClasses, costClasses]
  );

  const totalIncome = useMemo(() => {
    const rows = incomeClasses.flatMap((className) =>
      Object.values(grouped[className] ?? {}).flat()
    );
    return sumPlRows(rows);
  }, [grouped, incomeClasses]);

  const totalCosts = useMemo(() => {
    const rows = costClasses.flatMap((className) =>
      Object.values(grouped[className] ?? {}).flat()
    );
    return sumPlRows(rows);
  }, [grouped, costClasses]);

  const calculatedReturn = {
    period: totalIncome.period - totalCosts.period,
    compareValue: totalIncome.compareValue - totalCosts.compareValue,
  };

  const hasResults =
    Boolean(statement?.sections?.some((s) => s.lines.length > 0)) || plRows.length > 0;
  const rawApiCount = apiRows.length;
  const activeFrom = searchParams?.fromDate ?? fromDate;
  const activeTo = searchParams?.toDate ?? toDate;
  const compareColumnLabel =
    (searchParams?.compareTo ?? compareTo) === "Period Y-1" ? "Period Y-1" : "Accumulated";

  const openAccountDrilldown = (line: PlStatementLine) => {
    const code = String(line.account_code ?? "").trim();
    if (!code || !activeFrom || !activeTo) {
      return;
    }
    const cm = chartByCode.get(code);
    const accountType = Number(line.account_type ?? cm?.account_type ?? 0);
    const typeMeta = accountTypeMap[String(accountType)];
    const target = resolvePlAccountDrilldown(
      code,
      {
        accountType,
        classId: String(line.classId ?? typeMeta?.classId ?? ""),
        typeName: String(line.typeName ?? accountTypeLabelMap[String(accountType)] ?? ""),
        accountName: String(line.label ?? cm?.account_name ?? ""),
      },
      { fromDate: activeFrom, toDate: activeTo, dimension }
    );
    navigate(target.path, { state: target.state });
  };

  const renderDrilldownButton = (line: PlStatementLine) => {
    const code = String(line.account_code ?? "").trim();
    if (!code) {
      return null;
    }
    const cm = chartByCode.get(code);
    const accountType = Number(line.account_type ?? cm?.account_type ?? 0);
    const typeMeta = accountTypeMap[String(accountType)];
    const target = resolvePlAccountDrilldown(
      code,
      {
        accountType,
        classId: String(line.classId ?? typeMeta?.classId ?? ""),
        typeName: String(line.typeName ?? accountTypeLabelMap[String(accountType)] ?? ""),
        accountName: String(line.label ?? cm?.account_name ?? ""),
      },
      { fromDate: activeFrom, toDate: activeTo, dimension }
    );
    return (
      <Tooltip title={target.label}>
        <IconButton size="small" color="primary" onClick={() => openAccountDrilldown(line)}>
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  const renderStatement = (plStatement: PlStatement) =>
    plStatement.sections.map((section) => {
      const summaryOnly =
        section.key === "gross_profit" ||
        section.key === "total_income" ||
        (section.lines.length === 0 && section.subtotals.length > 0);

      return (
        <React.Fragment key={section.key}>
          {!summaryOnly && <ClassHeader className={section.title} />}

          {section.lines.map((line, index) => {
          if (line.kind === "group") {
            return <GroupHeader key={`${section.key}-g-${index}`} title={line.label ?? ""} />;
          }
          if (line.kind === "subtotal") {
            return (
              <StatementSubtotalRow
                key={`${section.key}-t-${index}`}
                line={line}
                highlight={Boolean(line.bold)}
              />
            );
          }
          if (line.kind === "account") {
            return (
              <TableRow key={`${section.key}-a-${line.account_code}-${index}`} hover>
                <TableCell sx={{ pl: 4 }}>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ minWidth: 0, p: 0, textTransform: "none", fontWeight: 600 }}
                    onClick={() => openAccountDrilldown(line)}
                  >
                    {line.account_code}
                  </Button>
                </TableCell>
                <TableCell>{line.label}</TableCell>
                <TableCell align="right">{formatStatementAmount(line.period ?? 0)}</TableCell>
                <TableCell align="right">{formatStatementAmount(line.compareValue ?? 0)}</TableCell>
                <TableCell align="right">
                  {line.achievePercent ?? achievePercent(line.period ?? 0, line.compareValue ?? 0)}
                </TableCell>
                <TableCell align="center">{renderDrilldownButton(line)}</TableCell>
              </TableRow>
            );
          }
          if (line.kind === "calculated") {
            return (
              <TableRow key={`${section.key}-c-${index}`}>
                <TableCell sx={{ pl: 4 }} />
                <TableCell sx={{ fontStyle: "italic" }}>{line.label}</TableCell>
                <TableCell align="right">{formatStatementAmount(line.period ?? 0)}</TableCell>
                <TableCell align="right">{formatStatementAmount(line.compareValue ?? 0)}</TableCell>
                <TableCell align="right">
                  {line.achievePercent ?? achievePercent(line.period ?? 0, line.compareValue ?? 0)}
                </TableCell>
                <TableCell />
              </TableRow>
            );
          }
          return null;
        })}

        {section.subtotals.map((subtotal, index) => (
          <StatementSubtotalRow
            key={`${section.key}-s-${index}`}
            line={subtotal}
            highlight={summaryOnly || Boolean(subtotal.bold)}
          />
        ))}
      </React.Fragment>
      );
    });

  const openPlRowDrilldown = (row: PlRow) => {
    openAccountDrilldown({
      kind: "account",
      account_code: row.account,
      label: row.groupAccountName,
      account_type: row.accountType,
      classId: row.classId,
      typeName: row.typeName,
    });
  };

  const renderClassSection = (classNames: string[], sectionLabel: string) =>
    classNames.map((className) => {
      const groups = grouped[className];
      if (!groups) return null;

      const groupOrder = (chartTypes as any[])
        .filter((ct) => {
          const mapped = accountTypeMap[String(ct.id)];
          return mapped?.className === className;
        })
        .map((ct) => String(ct.name ?? ""))
        .filter(Boolean);

      const groupNames = [
        ...groupOrder,
        ...Object.keys(groups).filter((g) => !groupOrder.includes(g)),
      ].filter((g, i, arr) => arr.indexOf(g) === i);

      return (
        <React.Fragment key={className}>
          <ClassHeader className={sectionLabel} />
          {groupNames.map((groupName) => {
            const rows = groups[groupName];
            if (!rows?.length) return null;
            const groupTotals = sumPlRows(rows);
            return (
              <React.Fragment key={`${className}-${groupName}`}>
                <GroupHeader title={groupName} />
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ pl: 4 }}>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ minWidth: 0, p: 0, textTransform: "none", fontWeight: 600 }}
                        onClick={() => openPlRowDrilldown(row)}
                      >
                        {row.account}
                      </Button>
                    </TableCell>
                    <TableCell>{row.groupAccountName}</TableCell>
                    <TableCell align="right">{formatStatementAmount(row.period)}</TableCell>
                    <TableCell align="right">{formatStatementAmount(row.compareValue)}</TableCell>
                    <TableCell align="right">{row.achievePercent}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View transactions">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openPlRowDrilldown(row)}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                <SubtotalRow
                  label={`Total ${groupName.toUpperCase()}`}
                  period={groupTotals.period}
                  compareValue={groupTotals.compareValue}
                />
              </React.Fragment>
            );
          })}
        </React.Fragment>
      );
    });

  return (
    <Stack spacing={2}>
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
          <PageTitle title="Profit and Loss Drilldown" />
          <Breadcrumb
            breadcrumbs={[
              { title: "Home", href: "/dashboard" },
              { title: "Profit and Loss Drilldown" },
            ]}
          />
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <GlHomeCurrencyNotice />

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report period"
              value={reportPeriodMode}
              onChange={(e) => {
                const mode = e.target.value as ReportPeriodMode;
                setReportPeriodMode(mode);
                setHasSearched(false);
                if (mode === "monthly" && !selectedMonth) {
                  setSelectedMonth(
                    defaultMonthInFiscalYear(fyDefaults.fiscalYearFrom, fyDefaults.fiscalYearTo)
                  );
                }
              }}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="custom">Custom date range</MenuItem>
            </TextField>
          </Grid>

          {reportPeriodMode === "monthly" ? (
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setHasSearched(false);
                }}
                InputLabelProps={{ shrink: true }}
              >
                {monthOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="From"
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setDateError("");
                    setHasSearched(false);
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!dateError && !fromDate}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="To"
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setDateError("");
                    setHasSearched(false);
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!dateError && !toDate}
                />
              </Grid>
            </>
          )}

          {reportPeriodMode === "monthly" && fromDate && toDate && (
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Date range"
                value={`${fromDate}  →  ${toDate}`}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Compare To"
              value={compareTo}
              onChange={(e) => {
                setCompareTo(e.target.value);
                setHasSearched(false);
              }}
            >
              {compareToOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <DimensionSelect
              label="Dimension"
              value={dimension}
              onChange={(value) => {
                setDimension(value);
                setHasSearched(false);
              }}
              emptyLabel="All dimensions"
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={handleShow}
              disabled={isLoading || (reportPeriodMode === "monthly" && monthOptions.length === 0)}
              sx={{ height: "40px", width: "100%" }}
            >
              {isLoading ? "Loading..." : "Show"}
            </Button>
          </Grid>
        </Grid>

        {dateError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {dateError}
          </Alert>
        )}

        {reportPeriodMode === "monthly" && monthOptions.length === 0 && !fyDefaults.isLoading && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No months found for the active fiscal year. Check Company Setup → Fiscal Year dates.
          </Alert>
        )}

        {!fyDefaults.isLoading && fyDefaults.fiscalYearFrom && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Fiscal Year: {formatFyDate(fyDefaults.fiscalYearFrom)} - {formatFyDate(fyDefaults.fiscalYearTo)} (Active)
            {activeFrom && activeTo ? ` · Period: ${formatFyDate(activeFrom)} - ${formatFyDate(activeTo)}` : ""}
            {reportPeriodMode === "monthly" && selectedMonth
              ? ` · ${formatMonthLabel(selectedMonth)}`
              : ""}
          </Alert>
        )}
      </Paper>

      {isError && <Alert severity="error">{getFriendlyApiErrorMessage(error)}</Alert>}

      {!hasSearched && !isLoading && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary" align="center">
            Select a date range and click Show to load profit and loss data.
          </Typography>
        </Paper>
      )}

      {hasSearched && !isLoading && !isError && !hasResults && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary" align="center" gutterBottom>
            No profit and loss activity found for {activeFrom} to {activeTo}.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            {rawApiCount > 0
              ? "The API returned accounts but all amounts were zero for this period."
              : "Profit & Loss only includes Income (Class 3) and Expense (Class 4) GL accounts. Opening balance journals on Assets, Liabilities, and Equity do not appear here."}
          </Typography>
          {!rawApiCount && (
            <Box sx={{ maxWidth: 520, mx: "auto" }}>
              <Typography variant="body2" color="text.secondary">
                Your opening journal on the fiscal year start date posts to balance sheet accounts
                (e.g. Furniture, Bank, Trade Debtors, Retained Earnings). That is correct — those
                balances belong on the Balance Sheet, not on P&L.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                To see P&L rows, post sales, purchases, or journals that hit income/expense accounts
                (e.g. <strong>2000 SALES</strong>, cost of sales, rent, salaries) within this date
                range.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {hasSearched && hasResults && (
        <TableContainer component={Paper} sx={{ p: 1 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: "12%" }}>Account</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Account Name</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {amountColumnLabel("Period")}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {amountColumnLabel(compareColumnLabel)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Achieved %
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", width: "8%" }}>
                  Link
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {statement ? (
                <>
                  {renderStatement(statement)}
                  <TableRow sx={{ backgroundColor: "#e8f5e9", borderTop: "3px solid #1b5e20" }}>
                    <TableCell colSpan={2} sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      Net Profit / (Loss)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {formatStatementAmount(statement.summary.netProfit.period)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {formatStatementAmount(statement.summary.netProfit.compare)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {statement.summary.netProfit.achievePercent}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </>
              ) : (
                <>
                  {renderClassSection(incomeClasses, "INCOME")}
                  {incomeClasses.length > 0 && (
                    <SubtotalRow
                      label="Total INCOME"
                      period={totalIncome.period}
                      compareValue={totalIncome.compareValue}
                      bold
                    />
                  )}

                  {renderClassSection(costClasses, "COSTS")}
                  {costClasses.length > 0 && (
                    <SubtotalRow
                      label="Total COSTS"
                      period={totalCosts.period}
                      compareValue={totalCosts.compareValue}
                      bold
                    />
                  )}

                  {otherClasses.length > 0 && renderClassSection(otherClasses, "OTHER")}

                  <TableRow sx={{ backgroundColor: "#fff3e0", borderTop: "3px solid black" }}>
                    <TableCell colSpan={2} sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      Calculated Return
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {formatStatementAmount(calculatedReturn.period)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {formatStatementAmount(calculatedReturn.compareValue)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {achievePercent(calculatedReturn.period, calculatedReturn.compareValue)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
