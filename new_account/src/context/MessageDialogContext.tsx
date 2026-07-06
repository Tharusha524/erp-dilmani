import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import MessageDialog, { MessageDialogType } from "../components/MessageDialog";
import { notify } from "../services/notificationService";
import { useNotificationStore, type NotificationKind } from "../store/notificationStore";

function dialogTypeToKind(type: MessageDialogType): NotificationKind {
  if (type === "success" || type === "error" || type === "warning") return type;
  return "info";
}

type ShowMessageOptions = {
  type?: MessageDialogType;
  title?: string;
  message: string;
};

type MessageDialogContextValue = {
  showMessage: (options: ShowMessageOptions) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
};

const MessageDialogContext = createContext<MessageDialogContextValue | null>(null);

export function MessageDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MessageDialogType>("info");
  const [title, setTitle] = useState<string | undefined>();
  const [message, setMessage] = useState("");

  const showMessage = useCallback((options: ShowMessageOptions) => {
    const type = options.type ?? "info";
    setType(type);
    setTitle(options.title);
    setMessage(options.message);
    setOpen(true);

    useNotificationStore.getState().push({
      kind: dialogTypeToKind(type),
      message: options.message,
      title: options.title,
    });
  }, []);

  const showError = useCallback(
    (msg: string, dialogTitle?: string) => showMessage({ type: "error", title: dialogTitle, message: msg }),
    [showMessage]
  );

  const showSuccess = useCallback(
    (msg: string, dialogTitle?: string) => showMessage({ type: "success", title: dialogTitle, message: msg }),
    [showMessage]
  );

  const value = useMemo(
    () => ({ showMessage, showError, showSuccess }),
    [showMessage, showError, showSuccess]
  );

  return (
    <MessageDialogContext.Provider value={value}>
      {children}
      <MessageDialog open={open} type={type} title={title} message={message} onClose={() => setOpen(false)} />
    </MessageDialogContext.Provider>
  );
}

export function useMessageDialog(): MessageDialogContextValue {
  const ctx = useContext(MessageDialogContext);
  if (!ctx) {
    throw new Error("useMessageDialog must be used within MessageDialogProvider");
  }
  return ctx;
}

/** Safe accessor for axios interceptors (outside React tree). */
let globalShowError: ((message: string) => void) | null = null;

export function registerGlobalErrorHandler(handler: (message: string) => void) {
  globalShowError = handler;
}

export function showGlobalError(message: string) {
  if (globalShowError) {
    globalShowError(message);
  } else {
    notify.errorDialog(message);
  }
}
