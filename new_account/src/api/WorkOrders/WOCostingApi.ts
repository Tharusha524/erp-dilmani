import api from "../apiClient";

const API_URL = "/wo-costing";

export interface WOCostingPayload {
  workorder_id: number;
  cost_type: number;
  trans_type: number;
  trans_no: number;
  factor: number;
}

export const getWOCostings = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching WO costings:", error);
    return [];
  }
};

export const getWOCostingById = async (id: number | string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching WO costing ${id}:`, error);
    return null;
  }
};

export const getWOCostingsByWorkorder = async (
  workorderId: number
) => {
  try {
    const response = await api.get(API_URL);
    return response.data.filter(
      (row: any) =>
        Number(row.workorder_id) === Number(workorderId)
    );
  } catch (error) {
    console.error("Error filtering WO costings:", error);
    return [];
  }
};

export const createWOCosting = async (
  payload: WOCostingPayload
) => {
  try {
    const response = await api.post(API_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating WO costing:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updateWOCosting = async (
  id: number | string,
  payload: WOCostingPayload
) => {
  try {
    const response = await api.put(
      `${API_URL}/${id}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating WO costing ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deleteWOCosting = async (id: number | string) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting WO costing ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};


