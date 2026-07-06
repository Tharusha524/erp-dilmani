import api from "../apiClient";

const API_BASE = "/supp-invoice-items";

export const getSuppInvoiceItems = async () => {
  const res = await api.get(API_BASE);
  return res.data;
};

export const getSuppInvoiceItemById = async (id: string | number) => {
  const res = await api.get(`${API_BASE}/${id}`);
  return res.data;
};

export const createSuppInvoiceItem = async (data: any) => {
  const res = await api.post(API_BASE, data);
  return res.data;
};

export const updateSuppInvoiceItem = async (id: string | number, data: any) => {
  const res = await api.put(`${API_BASE}/${id}`, data);
  return res.data;
};

export const deleteSuppInvoiceItem = async (id: string | number) => {
  const res = await api.delete(`${API_BASE}/${id}`);
  return res.data;
};


