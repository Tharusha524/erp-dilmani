import api from "../apiClient";

const API_URL = "/payment-terms";

// Create Payment Term
export const createPaymentTerm = async (data: any) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

// Get all Payment Terms
export const getPaymentTerms = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

// Get single Payment Term by ID
export const getPaymentTerm = async (id: number) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

// Update Payment Term
export const updatePaymentTerm = async (id: number, data: any) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

// Delete Payment Term
export const deletePaymentTerm = async (id: number) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};


