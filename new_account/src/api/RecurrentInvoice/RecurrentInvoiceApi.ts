import api from "../apiClient";

const API_URL = "/recurrent-invoices";

// Create Recurrent Invoice
export const createRecurrentInvoice = async (data: any) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

// Get all Recurrent Invoices
export const getRecurrentInvoices = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

// Get single Recurrent Invoice by ID
export const getRecurrentInvoice = async (id: number) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

// Update Recurrent Invoice
export const updateRecurrentInvoice = async (id: number, data: any) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

// Delete Recurrent Invoice
export const deleteRecurrentInvoice = async (id: number) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

export const generateRecurrentInvoice = async (id: number, invoiceDate?: string) => {
  const response = await api.post(`${API_URL}/${id}/generate`, { invoice_date: invoiceDate });
  return response.data;
};

export const generateAllDueRecurrentInvoices = async (asOfDate?: string) => {
  const response = await api.post(`${API_URL}/generate-all-due`, { as_of_date: asOfDate });
  return response.data;
};

