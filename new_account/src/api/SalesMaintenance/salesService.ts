import api from "../apiClient";

const SALES_TYPE_API = "/sales-types";
const SALES_GROUP_API = "/sales-groups";
const SALES_AREA_API = "/sales-areas";

/** ----- SalesType ----- */
export interface SalesType {
  id?: number;
  typeName: string;
  factor: number;
  taxIncl: boolean;
  status?: string;
}

export const getSalesTypes = async (): Promise<SalesType[]> => {
  const res = await api.get(SALES_TYPE_API);
  return res.data;
};

export const getSalesType = async (id: number): Promise<SalesType> => {
  const res = await api.get(`${SALES_TYPE_API}/${id}`);
  return res.data;
};

export const createSalesType = async (salesType: SalesType): Promise<SalesType> => {
  const res = await api.post(SALES_TYPE_API, salesType);
  return res.data;
};

export const updateSalesType = async (id: number, salesType: SalesType): Promise<SalesType> => {
  const res = await api.put(`${SALES_TYPE_API}/${id}`, salesType);
  return res.data;
};

export const deleteSalesType = async (id: number): Promise<void> => {
  await api.delete(`${SALES_TYPE_API}/${id}`);
};

/** ----- SalesGroup ----- */
export interface SalesGroup {
  id?: number;
  name: string;
  // optional inactive flag — API may return different shapes, keep it optional
  inactive?: boolean;
}

export const getSalesGroups = async (): Promise<SalesGroup[]> => {
  const res = await api.get(SALES_GROUP_API);
  return res.data;
};

export const getSalesGroup = async (id: number): Promise<SalesGroup> => {
  const res = await api.get(`${SALES_GROUP_API}/${id}`);
  return res.data;
};

export const createSalesGroup = async (salesGroup: SalesGroup): Promise<SalesGroup> => {
  const res = await api.post(SALES_GROUP_API, salesGroup);
  return res.data;
};

export const updateSalesGroup = async (id: number, salesGroup: SalesGroup): Promise<SalesGroup> => {
  const res = await api.put(`${SALES_GROUP_API}/${id}`, salesGroup);
  return res.data;
};

// Partial update (PATCH) helper to update specific fields like `inactive` without sending the whole entity
export const patchSalesGroup = async (id: number, payload: Partial<SalesGroup>): Promise<SalesGroup> => {
  const res = await api.patch(`${SALES_GROUP_API}/${id}`, payload);
  return res.data;
};

export const deleteSalesGroup = async (id: number): Promise<void> => {
  await api.delete(`${SALES_GROUP_API}/${id}`);
};

/** ----- SalesArea ----- */
export interface SalesArea {
  id?: number;
  name: string;
  // optional inactive flag — backend may or may not include it, keep optional
  inactive?: boolean;
}

export const getSalesAreas = async (): Promise<SalesArea[]> => {
  const res = await api.get(SALES_AREA_API);
  return res.data;
};

export const getSalesArea = async (id: number): Promise<SalesArea> => {
  const res = await api.get(`${SALES_AREA_API}/${id}`);
  return res.data;
};

export const createSalesArea = async (salesArea: SalesArea): Promise<SalesArea> => {
  const res = await api.post(SALES_AREA_API, salesArea);
  return res.data;
};

export const updateSalesArea = async (id: number, salesArea: SalesArea): Promise<SalesArea> => {
  const res = await api.put(`${SALES_AREA_API}/${id}`, salesArea);
  return res.data;
};

// Partial update (PATCH) helper to update specific fields like `inactive` without sending the whole entity
export const patchSalesArea = async (id: number, payload: Partial<SalesArea>): Promise<SalesArea> => {
  const res = await api.patch(`${SALES_AREA_API}/${id}`, payload);
  return res.data;
};

export const deleteSalesArea = async (id: number): Promise<void> => {
  await api.delete(`${SALES_AREA_API}/${id}`);
};


