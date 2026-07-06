import api from "../apiClient";

const API_URL = "/ref-lines";

export const getReflines = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching reflines:", error);
    return [];
  }
};

export const getReflineById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching refline ${id}:`, error);
    return null;
  }
};

export const createRefline = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating refline:", error.response?.data || error);
    throw error;
  }
};

export const updateRefline = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating refline ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteRefline = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting refline ${id}:`, error.response?.data || error);
    throw error;
  }
};


