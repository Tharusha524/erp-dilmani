import api from "../apiClient";

const API_URL = "/purch-data";

export interface PurchDataPayload {
  supplier_id: number;
  stock_id: string;
  price: number;
  suppliers_uom: string;
  conversion_factor: number;
  supplier_description?: string;
}

export const getPurchData = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching purch data:", error);
    return [];
  }
};

export const getPurchDataById = async (id: number | string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purch data ${id}:`, error);
    return null;
  }
};

export const getPurchDataBySupplier = async (supplierId: number) => {
  try {
    const response = await api.get(API_URL);
    return response.data.filter(
      (row: any) => Number(row.supplier_id) === Number(supplierId)
    );
  } catch (error) {
    console.error("Error filtering purch data by supplier:", error);
    return [];
  }
};

export const getPurchDataByStock = async (stockId: string) => {
  try {
    const response = await api.get(API_URL);
    return response.data.filter(
      (row: any) => String(row.stock_id) === String(stockId)
    );
  } catch (error) {
    console.error("Error filtering purch data by stock:", error);
    return [];
  }
};

export const createPurchData = async (payload: PurchDataPayload) => {
  try {
    const response = await api.post(API_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating purch data:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updatePurchData = async (
  id: number | string,
  payload: PurchDataPayload
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating purch data ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deletePurchData = async (id: number | string) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting purch data ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};


