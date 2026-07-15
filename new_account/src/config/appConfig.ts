/**
 * Grow Ledger deployment settings.
 * Values come from VITE_* env vars (see .env.example) so switching
 * deployment targets (local / CyberPanel / etc.) never requires a code edit.
 * Fallbacks below match the original finance.skytechsl.com/sky_erp deployment.
 */

const rawBasePath = (import.meta.env.VITE_APP_BASE_PATH ?? "/sky_erp").trim();
export const APP_BASE_PATH = `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`;

/** Trailing slash — use with React Router basename */
export const APP_ROUTER_BASENAME = `${APP_BASE_PATH}/`;

export const DEFAULT_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  "https://finance.skytechsl.com/sky_erp/backend/public/index.php/api"
).trim();

/** @deprecated Use getApiBaseUrl() from backendConfig for runtime URL */
export const API_BASE_URL = DEFAULT_API_BASE_URL;

const publicOrigin = (import.meta.env.VITE_APP_PUBLIC_ORIGIN ?? "https://finance.skytechsl.com").trim();

export const APP_PUBLIC_URL = `${publicOrigin}${APP_BASE_PATH}/`;

export const BACKEND_PUBLIC_URL =
  DEFAULT_API_BASE_URL.replace(/index\.php\/api\/?$/, "");
