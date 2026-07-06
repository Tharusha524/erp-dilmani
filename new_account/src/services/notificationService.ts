import type { EnqueueSnackbar } from "notistack";
import type { NotificationKind } from "../store/notificationStore";

type SnackFn = EnqueueSnackbar;
type DialogFn = (message: string, title?: string) => void;

interface NotifyOptions {
  title?: string;
  /** Show blocking dialog (default: false — toast only) */
  dialog?: boolean;
  /** Persist in notification center (default: true) */
  persist?: boolean;
  autoHideDuration?: number;
}

const pending: Array<{ kind: NotificationKind; message: string; options?: NotifyOptions }> = [];

let snackFn: SnackFn | null = null;
let errorDialogFn: DialogFn | null = null;

export function registerNotificationHandlers(handlers: {
  enqueueSnackbar: SnackFn;
  showErrorDialog: DialogFn;
}) {
  snackFn = handlers.enqueueSnackbar;
  errorDialogFn = handlers.showErrorDialog;

  pending.splice(0).forEach(({ kind, message, options }) => {
    emit(kind, message, options);
  });
}

export function unregisterNotificationHandlers() {
  snackFn = null;
  errorDialogFn = null;
}

function emit(kind: NotificationKind, message: string, options?: NotifyOptions) {
  const text = message.trim();
  if (!text) return;

  if (snackFn) {
    snackFn(text, {
      variant: kind,
      autoHideDuration:
        options?.autoHideDuration ?? (kind === "error" ? 6000 : 4000),
      preventDuplicate: true,
    });
  }

  if (kind === "error" && options?.dialog && errorDialogFn) {
    errorDialogFn(text, options.title);
  }
}

function dispatch(kind: NotificationKind, message: string, options?: NotifyOptions) {
  if (!snackFn) {
    pending.push({ kind, message, options });
    return;
  }
  emit(kind, message, options);
}

export const notify = {
  success: (message: string, options?: NotifyOptions) =>
    dispatch("success", message, options),
  error: (message: string, options?: NotifyOptions) =>
    dispatch("error", message, { dialog: false, ...options }),
  /** Network / critical errors — toast + dialog */
  errorDialog: (message: string, options?: Omit<NotifyOptions, "dialog">) =>
    dispatch("error", message, { dialog: true, autoHideDuration: 8000, ...options }),
  warning: (message: string, options?: NotifyOptions) =>
    dispatch("warning", message, options),
  info: (message: string, options?: NotifyOptions) =>
    dispatch("info", message, options),
};
