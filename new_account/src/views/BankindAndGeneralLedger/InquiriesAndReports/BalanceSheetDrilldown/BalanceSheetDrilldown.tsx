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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import api from "../../../../api/apiClient";
import CostCenterSelect from "../../../../components/CostCenterSelect";
import { useFiscalYearFormDefaults } from "../../../../hooks/useFiscalYearFormDefaults";
import GlHomeCurrencyNotice from "../../../../components/GlHomeCurrencyNotice";
import {
  GlReportMoneyProvider,
  useGlReportMoney,
} from "../../../../hooks/useGlReportMoney";
import {
  balanceSheetCategory,
  buildChartGroupMetaMap,
  isBalanceSheetAccount,
} from "../../../../utils/trialAccountBalance";
import {
  buildAccountTypeLabelMap,
  buildAccountTypeToClassMap,
  groupRowsByClassAndGroup,
  resolveRowClass,
  sumBsSlice,
  type BalanceSheetRowLike,
} from "../../../../utils/trialBalanceGrouping";

function AmountCell({ value }: { value: number }) {
  const { formatAmount } = useGlReportMoney();
  return <TableCell align="right">{formatAmount(value)}</TableCell>;
}

function ClassHeader({ classId, className }: { classId: string; className: string }) {
  return (
    <TableRow sx={{ backgroundColor: "#1565c0", borderTop: "3px solid #0d47a1" }}>
      <TableCell colSpan={4} sx={{ fontWeight: "bold", fontSize: "1.1em", color: "white", textAlign: "center" }}>
        Class {classId || "?"} — {className}
      </TableCell>
    </TableRow>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <TableRow sx={{ backgroundColor: "#e3f2fd", borderTop: "2px solid #1976d2" }}>
      <TableCell colSpan={4} sx={{ fontWeight: "bold", fontSize: "1.05em", color: "#1976d2", pl: 3 }}>
        {title}
      </TableCell>
    </TableRow>
  );
}

function SubtotalRow({
  label,
  opening,
  period,
  closing,
  bold = false,
}: {
  label: string;
  opening: number;
  period: number;
  closing: number;
  bold?: boolean;
}) {
  const { formatAmount } = useGlReportMoney();
  const sx = bold
    ? { fontWeight: 700, backgroundColor: "#e8eaf6", color: "#3f51b5" }
    : { fontWeight: 600, backgroundColor: "#f5f5f5" };

  return (
    <TableRow sx={sx}>
      <TableCell sx={{ pl: bold ? 2 : 4, ...sx }}>{label}</TableCell>
      <TableCell align="right" sx={sx}>
        {formatAmount(opening)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatAmount(period)}
      </TableCell>
      <TableCell align="right" sx={sx}>
        {formatAmount(closing)}
      </TableCell>
    </TableRow>
  );
}

function BalanceSheetDrilldownPage() {
  const { formatAmount, amountColumnLabel } = useGlReportMoney();
  const navigate = useNavigate();
  const fyDefaults = useFiscalYearFormDefaults();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [costCenter, setCostCenter] = useState("");

  const { data: chartClasses = [] } = useQuery({
    queryKey: ["chartClasses"],
    queryFn: () => import("../../../../api/GLAccounts/ChartClassApi").then((m) => m.getChartClasses()),
  });

  const { data: chartTypes = [] } = useQuery({
    queryKey: ["chartTypes"],
    queryFn: () => import("../../../../api/GLAccounts/ChartTypeApi").then((m) => m.getChartTypes()),
  });

  const chartGroupMeta = useMemo(
    () => buildChartGroupMetaMap(chartTypes as any[], chartClasses as any[]),
    [chartTypes, chartClasses]
  );

  const accountTypeMap = useMemo(
    () => buildAccountTypeLabelMap(chartTypes as any[]),
    [chartTypes]
  );

  const accountTypeToClassMap = useMemo(
    () => buildAccountTypeToClassMap(chartTypes as any[], chartClasses as any[]),
    [chartTypes, chartClasses]
  );

  useEffect(() => {
    if (fyDefaults.isLoading) return;
    setFromDate((prev) => prev || fyDefaults.fiscalYearFrom || "");
    setToDate((prev) => prev || fyDefaults.fiscalYearTo || fyDefaults.asAtDate || "");
  }, [fyDefaults.isLoading, fyDefaults.fiscalYearFrom, fyDefaults.fiscalYearTo, fyDefaults.asAtDate]);

  const canSearch = !!fromDate && !!toDate;

  const { data, refetch, isFetching, isError, error } = useQuery({
    queryKey: ["balanceSheet", fromDate, toDate, costCenter],
    queryFn: async () => {
      const response = await api.post(
        "/balance-sheet/search",
        {
          fromDate,
          toDate,
          costCenter: costCenter || null,
          noZeroValues: true,
          syncGl: true,
        },
        { skipErrorDialog: true } as Record<string, unknown>
      );
      return response.data;
    },
    enabled: canSearch,
  });

  const bsRows: BalanceSheetRowLike[] = useMemo(() => {
    const raw = data?.rows;
    const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : [];

    return (list as any[])
      .map((item: any) => {
        const accountType = Number(item.account_type ?? item.accountType) || 0;
        if (!isBalanceSheetAccount(accountType, chartGroupMeta)) {
          return null;
        }

        return {
          code: String(item.code || "").trim(),
          description: String(item.description || item.accountName || ""),
          account: String(item.code || "").trim(),
          accountType,
          classId: String(item.classId ?? item.class_id ?? ""),
          className: String(item.className ?? item.class ?? ""),
          typeName: String(item.typeName ?? item.type ?? ""),
          opening: parseFloat(item.opening) || 0,
          period: parseFloat(item.period) || 0,
          closing: parseFloat(item.closing) || 0,
          isCalculatedReturn: Boolean(item.is_calculated_return ?? item.isCalculatedReturn),
        } as BalanceSheetRowLike;
      })
      .filter((row): row is BalanceSheetRowLike => row !== null);
  }, [data?.rows, chartGroupMeta]);

  const groupedRows = useMemo(
    () =>
      groupRowsByClassAndGroup(
        bsRows,
        chartClasses as any[],
        accountTypeToClassMap,
        accountTypeMap
      ),
    [bsRows, chartClasses, accountTypeToClassMap, accountTypeMap]
  );

  const equationTotals = useMemo(() => {
    const totals = data?.totals;
    if (totals?.closing) {
      const opening = totals.opening ?? {};
      const period = totals.period ?? {};
      const closing = totals.closing ?? {};

      return {
        assets: {
          opening: Number(opening.total_assets) || 0,
          period: Number(period.total_assets) || 0,
          closing: Number(closing.total_assets) || 0,
        },
        liabilities: {
          opening: Number(opening.total_liabilities) || 0,
          period: Number(period.total_liabilities) || 0,
          closing: Number(closing.total_liabilities) || 0,
        },
        equity: {
          opening: Number(opening.total_equity) || 0,
          period: Number(period.total_equity) || 0,
          closing: Number(closing.total_equity) || 0,
        },
        liabilitiesPlusEquity: {
          opening: Number(opening.liabilities_plus_equity) || 0,
          period: Number(period.liabilities_plus_equity) || 0,
          closing: Number(closing.liabilities_plus_equity) || 0,
        },
        equationBalanced: Boolean(closing.equation_balanced),
        equationDifference: Math.abs(
          (Number(closing.total_assets) || 0) - (Number(closing.liabilities_plus_equity) || 0)
        ),
      };
    }

    let assets = { opening: 0, period: 0, closing: 0 };
    let liabilities = { opening: 0, period: 0, closing: 0 };
    let equity = { opening: 0, period: 0, closing: 0 };

    bsRows.forEach((row) => {
      const classInfo = resolveRowClass(row, accountTypeToClassMap, chartClasses as any[]);
      const classId = String(classInfo.classId ?? row.classId ?? "");

      if (classId === "1") {
        const slice = sumBsSlice([row]);
        assets = {
          opening: assets.opening + slice.opening,
          period: assets.period + slice.period,
          closing: assets.closing + slice.closing,
        };
        return;
      }

      if (classId === "2") {
        const category = balanceSheetCategory(row.accountType);
        const slice = sumBsSlice([row]);
        if (category === "equity") {
          equity = {
            opening: equity.opening + slice.opening,
            period: equity.period + slice.period,
            closing: equity.closing + slice.closing,
          };
        } else {
          liabilities = {
            opening: liabilities.opening + slice.opening,
            period: liabilities.period + slice.period,
            closing: liabilities.closing + slice.closing,
          };
        }
      }
    });

    const liabilitiesPlusEquity = {
      opening: liabilities.opening + equity.opening,
      period: liabilities.period + equity.period,
      closing: liabilities.closing + equity.closing,
    };

    return {
      assets,
      liabilities,
      equity,
      liabilitiesPlusEquity,
      equationBalanced: Math.abs(assets.closing - liabilitiesPlusEquity.closing) < 0.01,
      equationDifference: Math.abs(assets.closing - liabilitiesPlusEquity.closing),
    };
  }, [data?.totals, bsRows, accountTypeToClassMap, chartClasses]);

  const orderedClassNames = useMemo(() => {
    const fromSetup = (chartClasses as any[])
      .map((c) => String(c.class_name ?? c.name ?? ""))
      .filter(Boolean);
    const fromRows = Object.keys(groupedRows);
    const seen = new Set<string>();
    const ordered: string[] = [];

    [...fromSetup, ...fromRows].forEach((name) => {
      if (!name || seen.has(name)) return;
      const classRows = Object.values(groupedRows[name] ?? {}).flat();
      if (classRows.length === 0) return;
      const chartClass = (chartClasses as any[]).find(
        (c) => String(c.class_name ?? c.name) === name
      );
      const classId = String(chartClass?.cid ?? chartClass?.id ?? "");
      if (classId !== "1" && classId !== "2") return;
      seen.add(name);
      ordered.push(name);
    });

    return ordered;
  }, [chartClasses, groupedRows]);

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
          <PageTitle title="Balance Sheet" />
          <Breadcrumb breadcrumbs={[{ title: "Home", href: "/dashboard" }, { title: "Balance Sheet" }]} />
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
              fullWidth
              size="small"
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <CostCenterSelect
              label="Cost Center"
              value={costCenter}
              onChange={setCostCenter}
              emptyLabel="All costCenters"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={() => {
                if (!fromDate || !toDate) return;
                void refetch();
              }}
              disabled={isFetching || !fromDate || !toDate}
              sx={{ height: "40px", width: "100%" }}
            >
              {isFetching ? "Loading..." : "Show"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ p: 1 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Account</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {amountColumnLabel("Opening")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {amountColumnLabel("Period")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {amountColumnLabel("Closing")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: "error.main", py: 2 }}>
                  {(error as { data?: { message?: string } })?.data?.message ||
                    "Could not load balance sheet data."}
                </TableCell>
              </TableRow>
            )}
            {!isFetching && !isError && canSearch && bsRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 2, color: "text.secondary" }}>
                  No balance sheet accounts with activity for the selected dates. Check From/To dates
                  and that opening balances are posted.
                </TableCell>
              </TableRow>
            )}

            {orderedClassNames.map((className) => {
              const typeGroups = groupedRows[className] ?? {};
              const allClassRows = Object.values(typeGroups).flat();
              if (allClassRows.length === 0) return null;

              const chartClass = (chartClasses as any[]).find(
                (c) => String(c.class_name ?? c.name) === className
              );
              const classId = String(chartClass?.cid ?? chartClass?.id ?? "");
              const classTotals = sumBsSlice(allClassRows);

              const groupOrder = (chartTypes as any[])
                .filter((ct) => {
                  const mapped = accountTypeToClassMap[String(ct.id)];
                  return mapped?.className === className;
                })
                .map((ct) => String(ct.name ?? ""))
                .filter(Boolean);

              const groupNames = [
                ...groupOrder,
                ...Object.keys(typeGroups).filter((g) => !groupOrder.includes(g)),
              ].filter((g, i, arr) => arr.indexOf(g) === i);

              return (
                <React.Fragment key={className}>
                  <ClassHeader classId={classId} className={className} />

                  {groupNames.map((groupName) => {
                    const groupRows = [...(typeGroups[groupName] ?? [])].sort((a, b) => {
                      if (a.isCalculatedReturn && !b.isCalculatedReturn) return 1;
                      if (!a.isCalculatedReturn && b.isCalculatedReturn) return -1;
                      return 0;
                    });
                    if (!groupRows.length) return null;
                    const groupTotals = sumBsSlice(groupRows);

                    return (
                      <React.Fragment key={`${className}-${groupName}`}>
                        <GroupHeader title={groupName} />
                        {groupRows.map((row) => (
                          <TableRow
                            key={row.code || row.description}
                            hover
                            sx={
                              row.isCalculatedReturn
                                ? { backgroundColor: "#e8f5e9", fontStyle: "italic" }
                                : undefined
                            }
                          >
                            <TableCell sx={{ pl: 4 }}>
                              {row.description}
                              {row.code ? ` (${row.code})` : ""}
                            </TableCell>
                            <AmountCell value={row.opening} />
                            <AmountCell value={row.period} />
                            <AmountCell value={row.closing} />
                          </TableRow>
                        ))}
                        <SubtotalRow
                          label={`Subtotal — ${groupName}`}
                          opening={groupTotals.opening}
                          period={groupTotals.period}
                          closing={groupTotals.closing}
                        />
                      </React.Fragment>
                    );
                  })}

                  <SubtotalRow
                    label={`Class ${classId || "?"} Total — ${className}`}
                    opening={classTotals.opening}
                    period={classTotals.period}
                    closing={classTotals.closing}
                    bold
                  />
                </React.Fragment>
              );
            })}

            <TableRow sx={{ backgroundColor: "#f0f0f0", borderTop: "3px solid #000" }}>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1.05em" }}>Total Assets</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.opening)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.period)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.closing)}
              </TableCell>
            </TableRow>

            <SubtotalRow
              label="Total Liabilities"
              opening={equationTotals.liabilities.opening}
              period={equationTotals.liabilities.period}
              closing={equationTotals.liabilities.closing}
              bold
            />

            <SubtotalRow
              label="Total Equity"
              opening={equationTotals.equity.opening}
              period={equationTotals.equity.period}
              closing={equationTotals.equity.closing}
              bold
            />

            <TableRow sx={{ backgroundColor: "#f0f0f0", borderTop: "2px solid #000" }}>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1.05em" }}>
                Total Liabilities + Equity
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.liabilitiesPlusEquity.opening)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.liabilitiesPlusEquity.period)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.liabilitiesPlusEquity.closing)}
              </TableCell>
            </TableRow>

            <TableRow
              sx={{
                backgroundColor: equationTotals.equationBalanced ? "#e8f5e9" : "#ffebee",
              }}
            >
              <TableCell sx={{ fontWeight: "bold" }}>
                Check: Assets = Liabilities + Equity
                {!equationTotals.equationBalanced && equationTotals.equationDifference > 0.01
                  ? ` (Difference: ${formatAmount(equationTotals.equationDifference)})`
                  : ""}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.opening)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.period)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatAmount(equationTotals.assets.closing)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default function BalanceSheetDrilldown() {
  return (
    <GlReportMoneyProvider>
      <BalanceSheetDrilldownPage />
    </GlReportMoneyProvider>
  );
}
