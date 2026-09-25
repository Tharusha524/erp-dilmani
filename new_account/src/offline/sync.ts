/**
 * Pushes sales queued while offline (see db.ts) back up to Laravel once the
 * connection returns. Runs only inside the desktop app — the plain browser
 * build never queues anything locally, so this is always a no-op there.
 */
import { directSalesInvoice, type DirectSalesInvoicePayload } from "../api/SalesInvoice/SalesInvoiceApi";
import { notify } from "../services/notificationService";
import { isDesktopApp, listUnsyncedSales, markSaleSynced, markSaleSyncFailed } from "./db";

let syncing = false;

export async function syncPendingSales(): Promise<void> {
  if (!isDesktopApp() || syncing) return;
  syncing = true;
  try {
    const pending = await listUnsyncedSales();
    if (pending.length === 0) return;

    let succeeded = 0;
    let failed = 0;
    for (const sale of pending) {
      try {
        const payload: DirectSalesInvoicePayload = JSON.parse(sale.payload);
        await directSalesInvoice(payload);
        await markSaleSynced(sale.uuid);
        succeeded += 1;
      } catch (err: any) {
        // Leave it queued — it'll retry on the next sync pass rather than being lost.
        await markSaleSyncFailed(sale.uuid, err?.message ?? "Unknown sync error");
        failed += 1;
      }
    }

    if (succeeded > 0) notify.success(`Synced ${succeeded} offline sale${succeeded > 1 ? "s" : ""} to the server`);
    if (failed > 0) notify.error(`${failed} offline sale${failed > 1 ? "s" : ""} failed to sync — will retry`);
  } finally {
    syncing = false;
  }
}
