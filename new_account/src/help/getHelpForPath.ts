import { HELP_GUIDE_ENTRIES, HelpGuideEntry } from "./helpGuideContent";

/** Returns the most specific help entry for the current route (longest pathPrefix match). */
export function getHelpForPath(pathname: string): HelpGuideEntry {
  const normalized = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  let best: HelpGuideEntry | undefined;
  let bestLen = -1;

  for (const entry of HELP_GUIDE_ENTRIES) {
    const prefix = entry.pathPrefix;
    const matches =
      normalized === prefix || normalized.startsWith(`${prefix}/`);

    if (matches && prefix.length > bestLen) {
      best = entry;
      bestLen = prefix.length;
    }
  }

  return (
    best ??
    HELP_GUIDE_ENTRIES.find((e) => e.id === "dashboard") ??
    HELP_GUIDE_ENTRIES[0]
  );
}

export function getModuleHelpEntries(module: string): HelpGuideEntry[] {
  return HELP_GUIDE_ENTRIES.filter((e) => e.module === module);
}
