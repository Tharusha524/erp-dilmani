import api from "../apiClient";

const BASE_URL = "/bank-trans";

export const getBankTrans = async () => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const getBankTransById = async (id: number) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const createBankTrans = async (data: Record<string, unknown>) => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

export const updateBankTrans = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteBankTrans = async (id: number) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

