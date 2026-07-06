import api from "../apiClient";

const WORK_ORDERS_URL = "/work-orders";

export interface WorkOrderPayload {
  wo_ref: string;
  loc_code: string;
  units_reqd: number;
  stock_id: string;
  date: string;
  type: number;
  required_by: string;
  released_date: string;
  units_issued: number;
  closed: boolean;
  released: boolean;
  additional_costs: number;
}

export const getWorkOrders = async () => {
  try {
    const response = await api.get(WORK_ORDERS_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return [];
  }
};

export const getWorkOrderById = async (id: number | string) => {
  try {
    const response = await api.get(`${WORK_ORDERS_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching work order ${id}:`, error);
    return null;
  }
};

export const createWorkOrder = async (payload: WorkOrderPayload) => {
  try {
    const response = await api.post(WORK_ORDERS_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating work order:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updateWorkOrder = async (
  id: number | string,
  payload: WorkOrderPayload
) => {
  try {
    const response = await api.put(`${WORK_ORDERS_URL}/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating work order ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deleteWorkOrder = async (id: number | string) => {
  try {
    const response = await api.delete(`${WORK_ORDERS_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting work order ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export interface WorkOrderSearchParams {
  outstanding_only?: boolean;
  open_only?: boolean;
  order_no?: string;
  reference?: string;
  loc_code?: string;
  stock_id?: string;
  overdue_only?: boolean;
}

export const searchWorkOrders = async (params: WorkOrderSearchParams = {}) => {
  try {
    const response = await api.get("/manufacturing/inquiries/work-orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error searching work orders:", error);
    return [];
  }
};


