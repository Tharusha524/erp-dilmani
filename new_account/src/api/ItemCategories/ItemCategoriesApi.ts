import api from "../apiClient";
import { normalizeItemCategoryPayload } from "../../utils/itemCategoryPayload";

const API_BASE_URL = "/item-categories";

export const createItemCategory = async (
  data: Record<string, unknown>,
  chartMasters: { account_code: string }[] = []
) => {
  try {
    const payload = normalizeItemCategoryPayload(data, chartMasters);
    const response = await api.post(API_BASE_URL, payload);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating item category:", error);
    throw error;
  }
};

export const getItemCategories = async (includeInactive = false) => {
  try {
    const response = await api.get(API_BASE_URL, {
      params: { include_inactive: includeInactive },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching item categories:", error);
    throw error;
  }
};

export const getItemCategoryById = async (id: number) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching item category:", error);
    throw error;
  }
};

export const updateItemCategory = async (
  id: number,
  data: Record<string, unknown>,
  chartMasters: { account_code: string }[] = []
) => {
  try {
    const payload = normalizeItemCategoryPayload(data, chartMasters);
    const response = await api.put(`${API_BASE_URL}/${id}`, payload);
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating item category:", error);
    throw error;
  }
};

export const deleteItemCategory = async (id: number) => {
  try {
    const response = await api.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error deleting item category:", error);
    throw error;
  }
};
