import api from "../apiClient";

export interface WorkOrderLookupItem {
  id: number;
  name: string;
}

const BRANCH_URL = "/wo-sheet-branches";
const FABRIC_TYPE_URL = "/wo-sheet-fabric-types";

export const getWoSheetBranches = async (): Promise<WorkOrderLookupItem[]> => {
  const response = await api.get(BRANCH_URL);
  return response.data;
};

export const createWoSheetBranch = async (name: string) => {
  const response = await api.post(BRANCH_URL, { name });
  return response.data;
};

export const updateWoSheetBranch = async (id: number, name: string) => {
  const response = await api.put(`${BRANCH_URL}/${id}`, { name });
  return response.data;
};

export const deleteWoSheetBranch = async (id: number) => {
  const response = await api.delete(`${BRANCH_URL}/${id}`);
  return response.data;
};

export const getWoSheetFabricTypes = async (): Promise<WorkOrderLookupItem[]> => {
  const response = await api.get(FABRIC_TYPE_URL);
  return response.data;
};

export const createWoSheetFabricType = async (name: string) => {
  const response = await api.post(FABRIC_TYPE_URL, { name });
  return response.data;
};

export const updateWoSheetFabricType = async (id: number, name: string) => {
  const response = await api.put(`${FABRIC_TYPE_URL}/${id}`, { name });
  return response.data;
};

export const deleteWoSheetFabricType = async (id: number) => {
  const response = await api.delete(`${FABRIC_TYPE_URL}/${id}`);
  return response.data;
};
