/**
 * Auto-update for the desktop POS app. Checks the endpoint configured in
 * tauri.conf.json (build/plugins/updater), and if a newer signed release is
 * published there, downloads and installs it, then restarts the app.
 *
 * Requires, on the server side (not handled here):
 *  1. Hosting a `latest.json` manifest at the configured endpoint URL, with
 *     the new version's download URL + its signature (produced by
 *     `tauri signer sign` using src-tauri/updater.key — keep that file safe,
 *     it's gitignored and never committed).
 *  2. Re-signing and re-uploading that manifest on every release.
 * Without that hosting in place, checkForUpdate() below just finds nothing
 * and silently no-ops — it never breaks the app if the endpoint is missing.
 */
import { isDesktopApp } from "./db";
import { notify } from "../services/notificationService";

export async function checkForUpdate(): Promise<void> {
  if (!isDesktopApp()) return;

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (!update) return; // already on the latest version, or no manifest hosted yet

    notify.success(`Updating to version ${update.version}...`);
    await update.downloadAndInstall();
    await relaunch();
  } catch {
    // No update endpoint hosted yet, or offline — never block the app over this.
  }
}
