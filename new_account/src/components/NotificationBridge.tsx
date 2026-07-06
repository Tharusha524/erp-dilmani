import { useEffect } from "react";
import { useSnackbar } from "notistack";
import { useMessageDialog } from "../context/MessageDialogContext";
import {
  registerNotificationHandlers,
  unregisterNotificationHandlers,
} from "../services/notificationService";

/**
 * Connects notistack + message dialog to the global notification service.
 */
export default function NotificationBridge() {
  const { enqueueSnackbar } = useSnackbar();
  const { showError } = useMessageDialog();

  useEffect(() => {
    registerNotificationHandlers({
      enqueueSnackbar,
      showErrorDialog: showError,
    });

    return () => {
      unregisterNotificationHandlers();
    };
  }, [enqueueSnackbar, showError]);

  return null;
}
