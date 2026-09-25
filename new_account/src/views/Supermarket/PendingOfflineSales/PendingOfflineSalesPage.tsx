import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, Button, Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";
import { notify } from "../../../services/notificationService";
import { isDesktopApp, listAllSales, type PendingSale } from "../../../offline/db";
import { syncPendingSales } from "../../../offline/sync";
import { useOnlineStatus } from "../../../offline/useOnlineStatus";

/**
 * Every sale ever queued locally (synced or not) — lets a manager see what
 * happened while a terminal was offline, and retry anything still stuck.
 * Desktop app only; there's nothing to show in the plain browser build.
 */
export default function PendingOfflineSalesPage() {
  const { formatCurrency } = useHomeCurrency();
  const isOnline = useOnlineStatus();
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    if (!isDesktopApp()) return;
    setLoading(true);
    try {
      setSales(await listAllSales());
    } catch {
      notify.error("Could not read the local offline sales database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRetrySync = async () => {
    if (!isOnline) {
      notify.error("Still offline — connect to the internet before retrying");
      return;
    }
    setSyncing(true);
    try {
      await syncPendingSales();
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  const pendingCount = sales.filter((s) => !s.synced_at).length;

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <PageTitle title="Offline Sales" />
          <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Offline Sales" }]} />
        </Box>
        <Button
          variant="contained" startIcon={<RefreshIcon />} onClick={handleRetrySync}
          disabled={syncing || pendingCount === 0}
        >
          {syncing ? "Syncing..." : `Retry Sync (${pendingCount})`}
        </Button>
      </Box>

      {!isDesktopApp() ? (
        <Alert severity="info">
          This page only applies to the installed desktop POS app — the browser version never queues sales locally.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            {!isOnline && (
              <Alert icon={<WifiOffIcon />} severity="warning" sx={{ mb: 2 }}>
                Currently offline — queued sales will sync automatically once the connection returns.
              </Alert>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sale</TableCell>
                    <TableCell>Terminal</TableCell>
                    <TableCell>Cashier</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                          No offline sales recorded on this terminal
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {sales.map((s) => (
                    <TableRow key={s.uuid}>
                      <TableCell>{s.uuid.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>{s.terminal_id}</TableCell>
                      <TableCell>{s.cashier_id}</TableCell>
                      <TableCell>{formatCurrency(s.total)}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {s.synced_at ? (
                          <Chip label="Synced" color="success" size="small" />
                        ) : s.sync_error ? (
                          <Chip label="Sync failed — will retry" color="error" size="small" />
                        ) : (
                          <Chip label="Pending" color="warning" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </FormPageLayout>
  );
}
