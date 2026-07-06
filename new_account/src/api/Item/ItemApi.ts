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
    const response = await api.post(API_URL, payload);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating item:", error);
    throw error;
  }
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
