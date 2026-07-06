import api from "../apiClient";

const API_URL = "/trans-tax-details";

export const getTransTaxDetails = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
};

export const getTransTaxDetailById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
};

export const createTransTaxDetail = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating item:", error.response?.data || error);
    throw error;
  }
};

export const updateTransTaxDetail = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating item ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteTransTaxDetail = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting item ${id}:`, error.response?.data || error);
    throw error;
  }
};


