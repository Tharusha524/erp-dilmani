import { useEffect } from "react";

/** Trigger browser print once when document data is ready. */
export function useAutoPrint(enabled: boolean, delayMs = 400) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => window.print(), delayMs);
    return () => window.clearTimeout(timer);
  }, [enabled, delayMs]);
}
