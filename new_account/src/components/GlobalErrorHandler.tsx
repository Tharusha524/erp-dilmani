import { useEffect } from "react";
import { registerGlobalErrorHandler, useMessageDialog } from "../context/MessageDialogContext";

export default function GlobalErrorHandler() {
  const { showError } = useMessageDialog();

  useEffect(() => {
    registerGlobalErrorHandler(showError);
    return () => registerGlobalErrorHandler(() => {});
  }, [showError]);

  return null;
}
