import api from "../apiClient";
import {
  normalizeItemCodePayload,
  type ItemCodePayload,
  type ItemCodePayloadInput,
} from "../../utils/itemCodePayload";

const API_URL = "/item-codes";

export type { ItemCodePayload, ItemCodePayloadInput };

export const getItemCodes = async () => {
    try {
        const response = await api.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching item codes:", error);
        return [];
    }
};

export const getItemCodeById = async (id: string | number) => {
    try {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching item code ${id}:`, error);
        return null;
    }
};

export const createItemCode = async (data: ItemCodePayloadInput) => {
    try {
        const payload = normalizeItemCodePayload(data);
        const response = await api.post(API_URL, payload);
        return response.data;
    } catch (error: any) {
        console.error("Error creating item code:", error?.data ?? error);
        throw error;
    }
};

export const updateItemCode = async (id: string | number, data: ItemCodePayloadInput) => {
    try {
        const payload = normalizeItemCodePayload(data);
        const response = await api.put(`${API_URL}/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error updating item code ${id}:`, error?.data ?? error);
        throw error;
    }
};

export const deleteItemCode = async (id: string | number) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error deleting item code ${id}:`, error.response?.data || error);
        throw error;
    }
};


