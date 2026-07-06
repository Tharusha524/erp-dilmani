import { forwardRef, useEffect, useRef } from "react";
import {
  CustomContentProps,
  MaterialDesignContent,
  SnackbarMessage,
  SnackbarKey,
} from "notistack";
import { useNotificationStore, type NotificationKind } from "../store/notificationStore";

function variantToKind(variant?: string): NotificationKind {
  if (
    variant === "success" ||
    variant === "error" ||
    variant === "warning" ||
    variant === "info"
  ) {
    return variant;
  }
  return "info";
}

function messageToText(message?: SnackbarMessage): string {
  if (typeof message === "string") return message;
  if (message == null) return "";
  return String(message);
}

/** Records every toast into the notification center, then renders the default snackbar UI. */
export const AppSnackbarContent = forwardRef<HTMLDivElement, CustomContentProps>(
  function AppSnackbarContent(props, ref) {
    const recorded = useRef<SnackbarKey | null>(null);

    useEffect(() => {
      if (recorded.current === props.id) return;
      recorded.current = props.id;

      const text = messageToText(props.message).trim();
      if (!text) return;

      useNotificationStore.getState().push({
        kind: variantToKind(props.variant),
        message: text,
      });
    }, [props.id, props.message, props.variant]);

    return <MaterialDesignContent ref={ref} {...props} />;
  }
);

export const snackbarComponents = {
  default: AppSnackbarContent,
  success: AppSnackbarContent,
  error: AppSnackbarContent,
  warning: AppSnackbarContent,
  info: AppSnackbarContent,
};
