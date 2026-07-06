import { useEffect, useMemo, useState } from "react";

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

const SRI_LANKA_TIME_ZONE = "Asia/Colombo";

const sriLankaHourFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hour12: false,
  timeZone: SRI_LANKA_TIME_ZONE,
});

const sriLankaTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: SRI_LANKA_TIME_ZONE,
});

const sriLankaDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: SRI_LANKA_TIME_ZONE,
});

function getSriLankaHour(date = new Date()): number {
  return Number(sriLankaHourFormatter.format(date));
}

function formatSriLankaTime(date = new Date()): string {
  return sriLankaTimeFormatter.format(date);
}

function formatSriLankaDate(date = new Date()): string {
  return sriLankaDateFormatter.format(date);
}

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = getSriLankaHour(date);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export function getGreetingLabel(period: GreetingPeriod): string {
  switch (period) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Good night";
  }
}

export function getGreeting(date = new Date()): string {
  return getGreetingLabel(getGreetingPeriod(date));
}

/** Keeps greeting in sync with Sri Lankan time (updates every 30s and on tab focus). */
export function useTimeBasedGreeting(serverNowIso?: string) {
  const [clientNow, setClientNow] = useState(() => new Date());
  const [serverAnchor, setServerAnchor] = useState<{ serverMs: number; clientMs: number } | null>(null);

  useEffect(() => {
    if (!serverNowIso) return;
    const parsed = Date.parse(serverNowIso);
    if (!Number.isFinite(parsed)) return;
    setServerAnchor({
      serverMs: parsed,
      clientMs: Date.now(),
    });
  }, [serverNowIso]);

  useEffect(() => {
    const sync = () => setClientNow(new Date());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };

    sync();
    // Tick every second so the displayed clock is truly live.
    const timer = window.setInterval(sync, 1_000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const now = useMemo(() => {
    if (!serverAnchor) return clientNow;
    const elapsed = clientNow.getTime() - serverAnchor.clientMs;
    return new Date(serverAnchor.serverMs + elapsed);
  }, [clientNow, serverAnchor]);

  const greeting = useMemo(() => getGreeting(now), [now]);

  const localTimeLabel = useMemo(() => formatSriLankaTime(now), [now]);

  const sriLankaDateLabel = useMemo(() => formatSriLankaDate(now), [now]);

  return {
    greeting,
    localTimeLabel: `${localTimeLabel} GMT+5:30`,
    sriLankaDateLabel,
    now,
  };
}
