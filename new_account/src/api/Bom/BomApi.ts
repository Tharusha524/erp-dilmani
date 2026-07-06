import api from "../apiClient";

const BOM_API_URL = "/bom";

export interface BomPayload {
  parent: string;
  component: string;
  work_centre: number;
  loc_code: string;
  quantity: number;
}

/** Normalize API response — plain array or `{ data: [...] }`. */
export function normalizeBomList(raw: unknown): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: any[] }).data;
  }
  return [];
}

export function getBomParentCode(bom: any): string {
  return String(bom?.parent ?? bom?.parent_stock_id ?? bom?.parent_id ?? "").trim();
}

export function getBomLocCode(bom: any): string {
  return String(bom?.loc_code ?? bom?.loccode ?? bom?.loc ?? "").trim();
}

/** Match BOM lines for a parent; prefer destination location when provided. */
export function filterBomsByParent(
  boms: unknown,
  parentCode: string,
  locCode?: string
): any[] {
  const parent = String(parentCode ?? "").trim();
  if (!parent) {
    return [];
  }

  const all = normalizeBomList(boms).filter((bom) => getBomParentCode(bom) === parent);
  if (!locCode) {
    return all;
  }

  const loc = String(locCode).trim();
  const atLoc = all.filter((bom) => getBomLocCode(bom) === loc);
  return atLoc.length > 0 ? atLoc : all;
}

export const getBoms = async () => {
  const response = await api.get(BOM_API_URL);
  return normalizeBomList(response.data);
};

export const getBomsByParent = async (parent: string, locCode?: string) => {
  const response = await api.get(BOM_API_URL, {
    params: { parent: String(parent).trim() },
  });
  return filterBomsByParent(response.data, parent, locCode);
};

export const getBomById = async (id: string | number) => {
  try {
    const response = await api.get(`${BOM_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching BOM ${id}:`, error);
    return null;
  }
};

export const createBom = async (payload: BomPayload) => {
  try {
    const response = await api.post(BOM_API_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating BOM:", error.response?.data || error);
    throw error;
  }
};

export const updateBom = async (
  id: string | number,
  payload: BomPayload
) => {
  try {
    const response = await api.put(`${BOM_API_URL}/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating BOM ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteBom = async (id: string | number) => {
  try {
    const response = await api.delete(`${BOM_API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting BOM ${id}:`, error.response?.data || error);
    throw error;
  }
};


