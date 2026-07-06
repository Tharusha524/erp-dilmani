import api from "../apiClient";

const API_URL = "/debtor-trans";

export const getDebtorTrans = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching debtor transactions:", error);
    return [];
  }
};

export const getDebtorTranById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching debtor transaction ${id}:`, error);
    return null;
  }
};

export const createDebtorTran = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating debtor transaction:", error.response?.data || error.message || error);
    console.log("Full error:", error);
    throw error;
  }
};

export const updateDebtorTran = async (id: string | number, data: any) => {
  try {
    const response = await api.patch(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating debtor transaction ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteDebtorTran = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting debtor transaction ${id}:`, error.response?.data || error);
    throw error;
  }
};


