/**
 * Local offline database (SQLite via Tauri), used only when running as the
 * desktop POS app — not in the plain browser build. Holds a synced-down copy
 * of products/customers for offline lookup, and a queue of sales made while
 * offline (pending_sales), each tagged with a UUID + terminal/cashier id so
 * they sync back to Laravel exactly once even with several POS terminals.
 */
import Database from "@tauri-apps/plugin-sql";

let dbPromise: Promise<Database> | null = null;

/** True only inside the Tauri desktop shell — false in the plain browser app. */
export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function getDb(): Promise<Database> {
  if (!isDesktopApp()) {
    return Promise.reject(new Error("Offline database is only available in the desktop app"));
  }
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:pos.db");
  }
  return dbPromise;
}

export interface OfflineProduct {
  stock_id: string;
  barcode: string | null;
  description: string;
  unit_price: number;
  updated_at: string | null;
}

export interface OfflineCustomer {
  debtor_no: string;
  name: string;
  branch_code: string | null;
  updated_at: string | null;
}

export interface OfflineUser {
  id: string;
  email: string | null;
  name: string | null;
  user_json: string; // full User object, JSON-encoded
  permission_ids: string; // JSON-encoded number[]
  edit_permission_ids: string; // JSON-encoded number[]
  updated_at: string;
}

export interface PendingSale {
  uuid: string;
  terminal_id: string;
  cashier_id: string;
  customer_id: string | null;
  payload: string; // JSON-encoded sale payload, same shape as the online checkout submits
  total: number;
  created_at: string;
  synced_at: string | null;
  sync_error: string | null;
}

/** Replaces the local product cache with a fresh snapshot from the server. */
export async function saveProductsSnapshot(products: OfflineProduct[]): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM products");
  for (const p of products) {
    await db.execute(
      "INSERT INTO products (stock_id, barcode, description, unit_price, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [p.stock_id, p.barcode, p.description, p.unit_price, p.updated_at],
    );
  }
}

export async function listProducts(): Promise<OfflineProduct[]> {
  const db = await getDb();
  return db.select<OfflineProduct[]>("SELECT * FROM products ORDER BY description");
}

export async function findProductByBarcode(barcode: string): Promise<OfflineProduct | null> {
  const db = await getDb();
  const rows = await db.select<OfflineProduct[]>("SELECT * FROM products WHERE barcode = $1 LIMIT 1", [barcode]);
  return rows[0] ?? null;
}

/** Replaces the local customer cache with a fresh snapshot from the server. */
export async function saveCustomersSnapshot(customers: OfflineCustomer[]): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM customers");
  for (const c of customers) {
    await db.execute(
      "INSERT INTO customers (debtor_no, name, branch_code, updated_at) VALUES ($1, $2, $3, $4)",
      [c.debtor_no, c.name, c.branch_code, c.updated_at],
    );
  }
}

export async function listCustomers(): Promise<OfflineCustomer[]> {
  const db = await getDb();
  return db.select<OfflineCustomer[]>("SELECT * FROM customers ORDER BY name");
}

/** Queues a sale made while offline. Call this instead of the live checkout API when offline. */
export async function queuePendingSale(sale: Omit<PendingSale, "synced_at" | "sync_error">): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO pending_sales (uuid, terminal_id, cashier_id, customer_id, payload, total, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [sale.uuid, sale.terminal_id, sale.cashier_id, sale.customer_id, sale.payload, sale.total, sale.created_at],
  );
}

export async function listUnsyncedSales(): Promise<PendingSale[]> {
  const db = await getDb();
  return db.select<PendingSale[]>("SELECT * FROM pending_sales WHERE synced_at IS NULL ORDER BY created_at");
}

/** Every offline sale ever recorded on this terminal, synced or not — for the Offline Sales admin screen. */
export async function listAllSales(): Promise<PendingSale[]> {
  const db = await getDb();
  return db.select<PendingSale[]>("SELECT * FROM pending_sales ORDER BY created_at DESC");
}

export async function markSaleSynced(uuid: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE pending_sales SET synced_at = $1, sync_error = NULL WHERE uuid = $2", [
    new Date().toISOString(),
    uuid,
  ]);
}

export async function markSaleSyncFailed(uuid: string, error: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE pending_sales SET sync_error = $1 WHERE uuid = $2", [error, uuid]);
}

/** Upserts one authenticated user's cached session — called after every successful login/token check. */
export async function cacheAuthenticatedUser(
  id: string,
  email: string | null,
  name: string | null,
  userJson: string,
  permissionIds: number[],
  editPermissionIds: number[],
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO users (id, email, name, user_json, permission_ids, edit_permission_ids, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email, name = excluded.name, user_json = excluded.user_json,
       permission_ids = excluded.permission_ids, edit_permission_ids = excluded.edit_permission_ids,
       updated_at = excluded.updated_at`,
    [id, email, name, userJson, JSON.stringify(permissionIds), JSON.stringify(editPermissionIds), new Date().toISOString()],
  );
}

/** Reads back one cached user's session — used when opening the app with no connection at all. */
export async function getCachedUser(id: string): Promise<OfflineUser | null> {
  const db = await getDb();
  const rows = await db.select<OfflineUser[]>("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return rows[0] ?? null;
}

/**
 * Syncs the full user directory down (called while online, same pattern as
 * products/customers) so every user is at least recognised offline by name
 * and email — not just whoever has personally logged into this terminal
 * before. This does NOT enable a brand-new offline login: authenticating
 * (checking a password) still needs the server, since passwords are never
 * sent to or stored on the client. It only ever fills in the *profile*
 * fields, and only for a row that doesn't already have a full cached login
 * (user_json/permissions), so it can never overwrite a real session's
 * permissions with an empty placeholder.
 */
export async function saveUsersDirectorySnapshot(
  users: { id: string; email: string | null; name: string | null }[],
): Promise<void> {
  const db = await getDb();
  for (const u of users) {
    await db.execute(
      `INSERT INTO users (id, email, name, user_json, permission_ids, edit_permission_ids, updated_at)
       VALUES ($1, $2, $3, '{}', '[]', '[]', $4)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email, name = excluded.name, updated_at = excluded.updated_at`,
      [u.id, u.email, u.name, new Date().toISOString()],
    );
  }
}
