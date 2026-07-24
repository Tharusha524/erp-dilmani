import api from "../apiClient";

const API_URL = "/wo-sheet-orders";

export interface WorkOrderListItem {
  id: number;
  work_order_no: string;
  created_at: string;
  order_date: string | null;
  delivery_date: string | null;
  branch: string | null;
  customer: string | null;
  department: string | null;
  category: string;
  sub_category: string | null;
  description: string | null;
  process_type: string;
  order_quantity: number | null;
  total_price: string | null;
  advance: string | null;
  balance: string | null;
  reopen_datetime: string | null;
  status_name: string | null;
  status_sequence_order: number | null;
  created_by: string;
  assigned_to: string;
}

export interface WorkOrderSizeItem {
  id: number;
  category: string;
  size_label: string;
  quantity: number;
}

export interface WorkOrderPriceLineItem {
  id: number;
  item_name: string;
  price: string;
}

export interface WorkOrderEventItem {
  id: number;
  event_type: string;
  description: string | null;
  status_id: number | null;
  user_id: number | null;
  event_datetime: string | null;
  created_at: string;
}

export interface WorkOrderStatusInfo {
  id: number;
  name: string;
  category: string;
  process_type: string;
  sequence_order: number;
}

export interface WorkOrderDetail {
  id: number;
  work_order_no: string;
  branch: string | null;
  order_date: string | null;
  delivery_date: string | null;
  customer: string | null;
  contact_no: string | null;
  kind_of_fabric: string | null;
  description: string | null;
  front_image_path: string | null;
  back_image_path: string | null;
  embroider_front: string | null;
  embroider_back: string | null;
  embroider_sleeves: string | null;
  embroider_others: string | null;
  remark: string | null;
  total_price: string | null;
  advance: string | null;
  balance: string | null;
  category: string;
  sub_category: string | null;
  department: string | null;
  order_quantity: number | null;
  process_type: string;
  reopen_datetime: string | null;
  created_at: string;
  sizes: WorkOrderSizeItem[];
  price_items: WorkOrderPriceLineItem[];
  events: WorkOrderEventItem[];
  current_status: WorkOrderStatusInfo | null;
}

export const getWorkOrders = async (): Promise<WorkOrderListItem[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getWorkOrder = async (id: number | string): Promise<WorkOrderDetail> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createWorkOrder = async (formData: FormData) => {
  const response = await api.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const checkInWorkOrder = async (id: number): Promise<WorkOrderDetail> => {
  const response = await api.post(`${API_URL}/${id}/check-in`);
  return response.data;
};

export const nextStatusWorkOrder = async (id: number): Promise<WorkOrderDetail> => {
  const response = await api.post(`${API_URL}/${id}/next-status`);
  return response.data;
};

export const closeWorkOrder = async (id: number): Promise<WorkOrderDetail> => {
  const response = await api.post(`${API_URL}/${id}/close`);
  return response.data;
};

export const verifyWorkOrder = async (id: number): Promise<WorkOrderDetail> => {
  const response = await api.post(`${API_URL}/${id}/verify`);
  return response.data;
};

export const reopenWorkOrder = async (id: number): Promise<WorkOrderDetail> => {
  const response = await api.post(`${API_URL}/${id}/reopen`);
  return response.data;
};
