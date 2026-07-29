const quantityFormatter = new Intl.NumberFormat("en-US");
const amountFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole-number values (quantities, counts) with thousand separators, e.g. 10000 -> "10,000". */
export const formatWoQuantity = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? "-" : quantityFormatter.format(num);
};

/** Money-like values with 2 decimals and thousand separators, e.g. 10000 -> "10,000.00". */
export const formatWoAmount = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? "-" : amountFormatter.format(num);
};

/** Strips a live-typed value down to plain digits + at most one decimal point
 * (no thousand separators) — this is what should actually be stored/submitted. */
export const cleanWoNumberInput = (raw: string): string => {
  let value = raw.replace(/[^0-9.]/g, "");
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, "");
  }
  return value;
};

/** Live comma-formatted display for a raw numeric input string while typing,
 * e.g. "34455555" -> "34,455,555", "1500." -> "1,500.". */
export const formatWoNumberInputDisplay = (raw: string): string => {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const formattedInt = intPart ? Number(intPart).toLocaleString("en-US") : "";
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};
