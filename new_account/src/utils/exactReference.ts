/** Exact reference equality — never use substring/includes matching for GL lookups. */
export function referencesEqual(a: unknown, b: unknown): boolean {
  const left = String(a ?? "").trim();
  const right = String(b ?? "").trim();
  return left !== "" && left === right;
}

export type GlModule = "sales" | "purchases" | "manufacturing" | "fixed_assets" | "banking" | "inventory";
