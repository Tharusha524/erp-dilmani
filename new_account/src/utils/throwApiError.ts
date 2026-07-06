/** Re-throw API errors after apiClient interceptor (response object with .data) */
export function throwApiError(error: unknown): never {
  throw error;
}
