/** bom.loc_code column size in the database (varchar 5). */
export const MAX_BOM_LOC_CODE_LENGTH = 5;

export function isValidBomLocCode(code: unknown): boolean {
  const value = String(code ?? "").trim();
  return value.length > 0 && value.length <= MAX_BOM_LOC_CODE_LENGTH;
}
