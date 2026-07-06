import api from "../apiClient";

const API_URL = "/invoice-identifications";

// GET all Invoice Identifications
export const getInvoiceIdentifications = async () => {
  return await api.get(API_URL);
};

// GET single Invoice Identification by ID
export const getInvoiceIdentification = async (id) => {
  return await api.get(`${API_URL}/${id}`);
};

// CREATE new Invoice Identification
export const createInvoiceIdentification = async (data) => {
  return await api.post(API_URL, data);
};

// UPDATE Invoice Identification
export const updateInvoiceIdentification = async (id, data) => {
  return await api.put(`${API_URL}/${id}`, data);
};

// DELETE Invoice Identification
export const deleteInvoiceIdentification = async (id) => {
  return await api.delete(`${API_URL}/${id}`);
};


