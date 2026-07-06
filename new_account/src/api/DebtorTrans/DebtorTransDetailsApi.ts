import api from "../apiClient";

const API_URL = "/debtor-trans-details";

export const getDebtorTransDetails = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching debtor trans details:", error);
    return [];
  }
};

export const getDebtorTransDetailById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching debtor trans detail ${id}:`, error);
    return null;
  }
};

export const createDebtorTransDetail = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating debtor trans detail:", error.response?.data || error);
    throw error; // rethrow original axios error so callers can inspect error.response
  }
};

export const updateDebtorTransDetail = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating debtor trans detail ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteDebtorTransDetail = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting debtor trans detail ${id}:`, error.response?.data || error);
    throw error;
  }
};


