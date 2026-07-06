/** Fixed asset depreciation helpers for forms */

export type DepreciationMethodRow = {
  id?: number;
  type?: string;
  code?: string;
  description?: string;
  name?: string;
};

export function depreciationMethodTypeCode(
  methodId: string | number | undefined,
  methods: DepreciationMethodRow[]
): string {
  if (!methodId) return "S";
  const idStr = String(methodId).trim();
  if (idStr.length === 1 && /^[a-zA-Z]$/.test(idStr)) {
    return idStr.toUpperCase();
  }
  const m = methods.find(
    (dm) => String(dm.id ?? "") === idStr
  );
  const code = String(m?.type ?? m?.code ?? "").trim();
  return code ? code.toUpperCase() : "S";
}

export function isStraightLineMethod(
  methodId: string | number | undefined,
  methods: DepreciationMethodRow[]
): boolean {
  return depreciationMethodTypeCode(methodId, methods) === "S";
}

/** (Cost − Salvage) ÷ Useful Life */
export function straightLineAnnualDepreciation(
  cost: number,
  salvage: number,
  usefulLifeYears: number
): number {
  if (usefulLifeYears <= 0) return 0;
  const depreciable = Math.max(0, cost - Math.max(0, salvage));
  return Math.round((depreciable / usefulLifeYears) * 100) / 100;
}

export function straightLineMonthlyDepreciation(
  cost: number,
  salvage: number,
  usefulLifeYears: number
): number {
  return Math.round((straightLineAnnualDepreciation(cost, salvage, usefulLifeYears) / 12) * 100) / 100;
}
