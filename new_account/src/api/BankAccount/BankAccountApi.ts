import api from "../apiClient";

const API_URL = "/bank-accounts";

export const createBankAccount = async (bankAccountData: any) => {
  try {
    const response = await api.post(API_URL, bankAccountData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getBankAccounts = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getBankAccount = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateBankAccount = async (
  id: string | number,
  bankAccountData: any
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, bankAccountData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteBankAccount = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


