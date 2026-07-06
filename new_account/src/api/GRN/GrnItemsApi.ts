import api from "../apiClient";

const API_URL = "/grn-items";

export const getGrnItems = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching GRN items:", error);
    return [];
  }
};

export const getGrnItemById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching GRN item ${id}:`, error);
    return null;
  }
};

export const createGrnItem = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data; // returns created item
  } catch (error: any) {
    console.error(
      "Error creating GRN item:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updateGrnItem = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating GRN item ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deleteGrnItem = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting GRN item ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};


