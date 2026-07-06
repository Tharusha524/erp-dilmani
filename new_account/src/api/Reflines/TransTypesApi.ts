import api from "../apiClient";

const API_URL = "/trans-types";

export const getTransTypes = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching trans types:", error);
    return [];
  }
};

export const getTransTypeById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching trans type ${id}:`, error);
    return null;
  }
};

export const createTransType = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating trans type:", error.response?.data || error);
    throw error;
  }
};

export const updateTransType = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating trans type ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteTransType = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting trans type ${id}:`, error.response?.data || error);
    throw error;
  }
};


