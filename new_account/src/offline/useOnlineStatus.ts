import { useEffect, useState } from "react";

/** Tracks browser connectivity so the checkout page can switch to offline mode. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

const TERMINAL_ID_KEY = "pos_terminal_id";

/** A stable id for this POS computer, generated once and kept in localStorage —
 * lets the server tell which terminal an offline sale came from. */
export function getOrCreateTerminalId(): string {
  let id = localStorage.getItem(TERMINAL_ID_KEY);
  if (!id) {
    id = `TERM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    localStorage.setItem(TERMINAL_ID_KEY, id);
  }
  return id;
}
