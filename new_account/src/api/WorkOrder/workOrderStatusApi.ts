import api from "../apiClient";

export interface WorkOrderStatus {
  id: number;
  name: string;
  category: string;
  process_type: "normal" | "bulk";
  sequence_order: number;
  inactive: boolean;
}

export interface WorkOrderStatusAssignment {
  id: number;
  status_id: number;
  user_id: number;
  user_name: string;
}

const STATUS_URL = "/wo-sheet-statuses";
const ASSIGNMENT_URL = "/wo-sheet-status-assignments";

export const getWorkOrderStatuses = async (): Promise<WorkOrderStatus[]> => {
  const response = await api.get(STATUS_URL);
  return response.data;
};

export const createWorkOrderStatus = async (data: Partial<WorkOrderStatus>) => {
  const response = await api.post(STATUS_URL, data);
  return response.data;
};

export const updateWorkOrderStatus = async (id: number, data: Partial<WorkOrderStatus>) => {
  const response = await api.put(`${STATUS_URL}/${id}`, data);
  return response.data;
};

export const deleteWorkOrderStatus = async (id: number) => {
  const response = await api.delete(`${STATUS_URL}/${id}`);
  return response.data;
};

export const getWorkOrderStatusAssignments = async (): Promise<WorkOrderStatusAssignment[]> => {
  const response = await api.get(ASSIGNMENT_URL);
  return response.data;
};

export const assignWorkOrderStatusUser = async (statusId: number, userId: number) => {
  const response = await api.post(ASSIGNMENT_URL, { status_id: statusId, user_id: userId });
  return response.data;
};

export const unassignWorkOrderStatusUser = async (statusId: number) => {
  const response = await api.delete(`${ASSIGNMENT_URL}/${statusId}`);
  return response.data;
};
