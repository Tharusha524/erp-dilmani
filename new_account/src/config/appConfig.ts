/**
 * Grow Ledger deployment settings.
 * Frontend: https://finance.skytechsl.com/sky_erp/
 * Backend:  https://finance.skytechsl.com/sky_erp/backend/public/
 */

export const APP_BASE_PATH = "/sky_erp";

/** Trailing slash — use with React Router basename */
export const APP_ROUTER_BASENAME = `${APP_BASE_PATH}/`;

export const DEFAULT_API_BASE_URL =
  "https://finance.skytechsl.com/sky_erp/backend/public/index.php/api";

/** @deprecated Use getApiBaseUrl() from backendConfig for runtime URL */
export const API_BASE_URL = DEFAULT_API_BASE_URL;

export const APP_PUBLIC_URL = `https://finance.skytechsl.com${APP_BASE_PATH}/`;

export const BACKEND_PUBLIC_URL =
  "https://finance.skytechsl.com/sky_erp/backend/public/";
