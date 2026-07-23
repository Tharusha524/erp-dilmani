import api from "../apiClient";

const API_URL = "/wo-sheet-orders";

export interface WorkOrderListItem {
  id: number;
  work_order_no: string;
  created_at: string;
  department: string | null;
  category: string;
  sub_category: string | null;
  description: string | null;
  process_type: string;
  order_quantity: number | null;
  reopen_datetime: string | null;
  status_name: string | null;
  created_by: string;
}

export const getWorkOrders = async (): Promise<WorkOrderListItem[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getWorkOrder = async (id: number | string) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createWorkOrder = async (formData: FormData) => {
  const response = await api.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
