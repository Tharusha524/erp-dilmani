import { FormPageLayout } from "../../../../components/Layout/FormPageLayout";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../../components/BreadCrumb";
import PageTitle from "../../../../components/PageTitle";
import theme from "../../../../theme";
import {
  fetchCostCenterGlBalance,
  getCostCenter,
  type CostCenterRecord,
} from "../../../../api/CostCenter/CostCenterApi";

function formatMoney(value: number): string {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ViewCostCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [costCenter, setCostCenter] = useState<CostCenterRecord | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [total, setTotal] = useState(0);
  const [lines, setLines] = useState<{ account: string; account_name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBalance = useCallback(
    async (from?: string, to?: string) => {
      if (!id) return;
      setBalanceLoading(true);
      try {
        const data = await fetchCostCenterGlBalance(id, {
          fromDate: from || undefined,
          toDate: to || undefined,
        });
        setFromDate(data.fromDate?.split("T")[0] ?? from ?? "");
        setToDate(data.toDate?.split("T")[0] ?? to ?? "");
        setTotal(data.total);
        setLines(data.lines ?? []);
      } catch {
        setLines([]);
        setTotal(0);
      } finally {
        setBalanceLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCostCenter(id)
      .then((d) => {
        setCostCenter(d);
        setError("");
      })
      .catch(() => {
        setCostCenter(null);
        setError("CostCenter not found.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (costCenter) {
      void loadBalance();
    }
  }, [costCenter, loadBalance]);

  const handleShow = () => {
    void loadBalance(fromDate, toDate);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!costCenter) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error || "CostCenter not found."}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    );
  }

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
          gap: 2,
        }}
      >
        <Box>
          <PageTitle title={`View CostCenter #${costCenter.id}`} />
          <Breadcrumb
            breadcrumbs={[
              { title: "Home", href: "/dashboard" },
              { title: "CostCenters", href: "/costCenter/inquiriesandreports" },
              { title: "View CostCenter" },
            ]}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/costCenter/transactions/edit-costCenter-entry/${costCenter.id}`)}
          >
            Edit
          </Button>
        </Stack>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          CostCenter #{costCenter.id}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Reference
            </Typography>
            <Typography variant="body1">{costCenter.reference}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{costCenter.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body1">
              {Number(costCenter.type) === 2 ? "CostCenter 2" : "CostCenter 1"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body1">
              {costCenter.start_date ? String(costCenter.start_date).split("T")[0] : "—"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Due Date
            </Typography>
            <Typography variant="body1">
              {costCenter.date_required_by
                ? String(costCenter.date_required_by).split("T")[0]
                : "—"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1">{costCenter.closed ? "Closed" : "Open"}</Typography>
          </Grid>
          {costCenter.tag?.tagName && (
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">
                Tag
              </Typography>
              <Typography variant="body1">{costCenter.tag.tagName}</Typography>
            </Grid>
          )}
          {costCenter.memo && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Memo
              </Typography>
              <Typography variant="body1" whiteSpace="pre-line">
                {costCenter.memo}
              </Typography>
            </Grid>
          )}
        </Grid>
        {costCenter.closed && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This costCenter is closed.
          </Alert>
        )}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Balance for this CostCenter
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4} md={3}>
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
          <Grid item xs={12} sm={4} md={3}>
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
          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="contained"
              onClick={handleShow}
              disabled={balanceLoading}
              sx={{ height: 40, width: "100%" }}
            >
              {balanceLoading ? <CircularProgress size={22} color="inherit" /> : "Show"}
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!balanceLoading && lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No GL transactions for this costCenter in the selected period.
                  </TableCell>
                </TableRow>
              )}
              {lines.map((line) => (
                <TableRow key={line.account}>
                  <TableCell>
                    {line.account} {line.account_name !== line.account ? line.account_name : ""}
                  </TableCell>
                  <TableCell align="right">
                    {line.amount > 0 ? formatMoney(line.amount) : ""}
                  </TableCell>
                  <TableCell align="right">
                    {line.amount < 0 ? formatMoney(Math.abs(line.amount)) : ""}
                  </TableCell>
                </TableRow>
              ))}
              {lines.length > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {total >= 0 ? formatMoney(total) : ""}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {total < 0 ? formatMoney(Math.abs(total)) : ""}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </FormPageLayout>
  );
}
