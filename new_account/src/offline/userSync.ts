/**
 * Syncs the user directory (names/emails only — no passwords) down into
 * SQLite whenever online, the same way products/customers sync — see
 * saveUsersDirectorySnapshot in db.ts for what this can and can't enable.
 */
import { getUsers } from "../api/UserManagement/userManagement";
import { isDesktopApp, saveUsersDirectorySnapshot } from "./db";

export async function syncUserDirectory(): Promise<void> {
  if (!isDesktopApp()) return;
  try {
    const users = await getUsers();
    if (!Array.isArray(users) || users.length === 0) return;
    await saveUsersDirectorySnapshot(
      users.map((u: any) => ({
        id: String(u.id),
        email: u.email ?? null,
        name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.name || null,
      })),
    );
  } catch {
    // Offline, or the endpoint failed — the directory just stays as it was from the last sync.
  }
}
