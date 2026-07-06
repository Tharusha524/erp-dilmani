import { getFriendlyApiErrorMessage } from "./apiErrorMessage";

export type TransactionSaveResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * FrontAccounting-style save wrapper: run API work once, map errors to user text,
 * never treat failures as success.
 */
export async function runTransactionSave<T>(
  saveFn: () => Promise<T>
): Promise<TransactionSaveResult<T>> {
  try {
    const data = await saveFn();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: getFriendlyApiErrorMessage(error) };
  }
}

/** Require a persisted identifier in API response (order_no, trans_no, id, …). */
export function assertPersistedResponse(
  response: Record<string, unknown> | null | undefined,
  keys: string[] = ["id", "order_no", "trans_no"]
): void {
  if (!response || typeof response !== "object") {
    throw new Error("Save response was empty.");
  }
  const found = keys.some((key) => {
    const value = response[key];
    return value !== undefined && value !== null && value !== "";
  });
  if (!found) {
    throw new Error("Save could not be verified from server response.");
  }
}
