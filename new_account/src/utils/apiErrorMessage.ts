import { AxiosError } from "axios";

const TECHNICAL_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /stack trace/i,
  /sqlstate/i,
  /exception/i,
  /vendor[\\/]/i,
  /at\s+\/[^\s]+:\d+/i,
];

function sanitizeText(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return "";

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    return "";
  }

  cleaned = cleaned.replace(/https?:\/\/127\.0\.0\.1:\d+/gi, "");
  cleaned = cleaned.replace(/https?:\/\/localhost:\d+/gi, "");

  return cleaned.trim();
}

function validationMessage(data: Record<string, unknown>): string | null {
  if (data.errors && typeof data.errors === "object") {
    const lines = Object.values(data.errors as Record<string, string[]>)
      .flat()
      .map((line) => sanitizeText(String(line)))
      .filter(Boolean);
    if (lines.length) return lines.join("\n");
  }
  return null;
}

function extractResponsePayload(error: unknown): {
  status?: number;
  data?: Record<string, unknown>;
} {
  const err = error as AxiosError<{ message?: string; error?: string }> & {
    data?: Record<string, unknown>;
    status?: number;
  };

  if (err?.response) {
    return {
      status: err.response.status,
      data: err.response.data as Record<string, unknown> | undefined,
    };
  }

  // apiClient rejects with axios `response` directly (data at top level)
  if (err?.data && typeof err.data === "object") {
    return { status: err.status, data: err.data };
  }

  return { status: err?.status, data: undefined };
}

export function getFriendlyApiErrorMessage(error: unknown): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const { status, data } = extractResponsePayload(error);

  if (data) {
    const validation = validationMessage(data);
    if (validation) return validation;

    const raw =
      sanitizeText(String(data.message ?? "")) ||
      sanitizeText(String(data.error ?? ""));
    if (raw) return raw;
  }

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 429) {
    return "Too many requests. Please wait a few minutes and try again.";
  }
  if (status === 404) {
    const err = error as AxiosError;
    const path = err?.config?.url ?? err?.response?.config?.url;
    if (path && String(path).includes("entity-attachments")) {
      return "Attachments are not available yet. Run database migrations on the server (php artisan migrate).";
    }
    if (path && String(path).includes("organizations")) {
      return "Organization settings could not be loaded. Use Setup → Company Setup to configure your company.";
    }
    return "The requested resource was not found. Check that the API server is running and the route exists.";
  }
  if (status === 422) {
    if (data?.message && typeof data.message === "string") {
      const cleaned = sanitizeText(data.message);
      if (cleaned) return cleaned;
    }
    return "Please check the form and try again. Ensure an inventory item is selected, quantity is a whole number (at least 1), and the category exists.";
  }
  if (status && status >= 500) {
    const detail = String(data?.error ?? "");
    const message = String(data?.message ?? "").trim();

    if (/price list|sales type/i.test(detail) || /price list|sales type/i.test(message)) {
      return message || detail;
    }
        if (/doesn't have a default value/i.test(detail)) {
      if (/delivery_address/i.test(detail)) {
        return "Delivery address is required. Ensure the customer has an address or enter delivery details.";
      }
      if (/deliver_to/i.test(detail)) {
        return "Deliver-to name is required. Select a customer first.";
      }
      if (/gst/i.test(detail)) {
        return "GST number is missing. Leave it blank or enter a value and try again.";
      }
    }
    if (/foreign key constraint/i.test(detail) && /order_type/i.test(detail)) {
      return "Please select a valid price list (e.g. Retail or Wholesale).";
    }
    if (/foreign key constraint|integrity constraint violation/i.test(detail)) {
      return "This record is linked to other transactions and cannot be deleted. Mark it as inactive instead.";
    }

    if (message && !/sqlstate|exception|vendor/i.test(message)) {
      return message;
    }
    if (/column not found|unknown column|doesn't exist/i.test(detail)) {
      return "A database error occurred. Please deploy the latest backend update and run migrations.";
    }
    return "A server error occurred. Please try again later.";
  }

  const errMessage = (error as AxiosError)?.message;
  if (errMessage) {
    const cleaned = sanitizeText(errMessage);
    if (cleaned && !/^network error$/i.test(cleaned)) {
      return cleaned;
    }
  }

  return "Unable to complete the request. Please check your connection and try again.";
}
