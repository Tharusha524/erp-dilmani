/**
 * Re-export the shared API client. Interceptors live in apiClient.ts only
 * to avoid duplicate error dialogs and double rejection handling.
 */
export { default } from "./apiClient";
