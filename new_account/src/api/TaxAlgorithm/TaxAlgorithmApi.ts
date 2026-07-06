import api from "../apiClient";

const API_URL = "/tax-algorithms";

// GET all Tax Algorithms
export const getTaxAlgorithms = async () => {
  return await api.get(API_URL);
};

// GET single Tax Algorithm by ID
export const getTaxAlgorithm = async (id) => {
  return await api.get(`${API_URL}/${id}`);
};

// CREATE new Tax Algorithm
export const createTaxAlgorithm = async (data) => {
  return await api.post(API_URL, data);
};

// UPDATE Tax Algorithm
export const updateTaxAlgorithm = async (id, data) => {
  return await api.put(`${API_URL}/${id}`, data);
};

// DELETE Tax Algorithm
export const deleteTaxAlgorithm = async (id) => {
  return await api.delete(`${API_URL}/${id}`);
};


