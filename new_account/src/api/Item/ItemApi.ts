import api from "../apiClient";
import { normalizeStockMasterPayload } from "../../utils/stockMasterPayload";

const API_URL = "/stock-masters";

export const getItems = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
};

export const getItemById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
};

function toStockMasterFormData(
  payload: Record<string, unknown>,
  imageFile: unknown
): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    formData.append(key, String(value));
  });
  if (imageFile instanceof File) {
    formData.append("image", imageFile);
  }
  return formData;
}

export const createItem = async (
  data: Record<string, unknown>,
  options?: {
    chartMasters?: { account_code: string }[];
    category?: Record<string, unknown>;
  }
) => {
  try {
    const payload = normalizeStockMasterPayload(
      data,
      options?.chartMasters ?? [],
      options?.category
    );
    const imageFile = data.imageFile;
    if (imageFile instanceof File) {
      const formData = toStockMasterFormData(payload, imageFile);
      const response = await api.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }
    const response = await api.post(API_URL, payload);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating item:", error);
    throw error;
  }
};

export const updateMrpPrice = async (stockId: string, mrpPrice: number | null) => {
  const response = await api.patch(`${API_URL}/${stockId}/mrp-price`, { mrp_price: mrpPrice });
  return response.data;
};

export const updateExpiryDate = async (stockId: string, expiryDate: string | null) => {
  const response = await api.patch(`${API_URL}/${stockId}/expiry-date`, { expiry_date: expiryDate });
  return response.data;
};

export const bulkUpdateUnits = async (stockIds: string[], unitId: number) => {
  const response = await api.patch(`${API_URL}/bulk-units`, { stock_ids: stockIds, units: unitId });
  return response.data;
};

export const updateWholesalePricing = async (
  stockId: string,
  wholesaleQtyThreshold: number | null,
  wholesalePrice: number | null
) => {
  const response = await api.patch(`${API_URL}/${stockId}/wholesale-pricing`, {
    wholesale_qty_threshold: wholesaleQtyThreshold,
    wholesale_price: wholesalePrice,
  });
  return response.data;
};

export const getExpiryList = async (withinDays = 90) => {
  const response = await api.get("/stock-masters-expiry-list", { params: { within_days: withinDays } });
  return response.data;
};

export const bulkCreateStockMasters = async (rows: Record<string, unknown>[]) => {
  const response = await api.post(`${API_URL}/bulk`, { rows });
  return response.data;
};

export const updateItem = async (
  id: string | number,
  data: Record<string, unknown>,
  options?: {
    chartMasters?: { account_code: string }[];
    category?: Record<string, unknown>;
  }
) => {
  try {
    const payload = normalizeStockMasterPayload(
      data,
      options?.chartMasters ?? [],
      options?.category
    );
    const imageFile = data.imageFile;
    if (imageFile instanceof File) {
      const formData = toStockMasterFormData(payload, imageFile);
      formData.append("_method", "PUT");
      const response = await api.post(`${API_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }
    const response = await api.put(`${API_URL}/${id}`, payload);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

export const deleteItem = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
};
