import api from "../apiClient";

const API_URL = "/depreciation-methods";

// GET all Depreciation Methods
export const getDepreciationMethods = async () => {
  return await api.get(API_URL);
};

// GET single Depreciation Method by ID
export const getDepreciationMethod = async (id) => {
  return await api.get(`${API_URL}/${id}`);
};

// CREATE new Depreciation Method
export const createDepreciationMethod = async (data) => {
  return await api.post(API_URL, data);
};

// UPDATE Depreciation Method
export const updateDepreciationMethod = async (id, data) => {
  return await api.put(`${API_URL}/${id}`, data);
};

// DELETE Depreciation Method
export const deleteDepreciationMethod = async (id) => {
  return await api.delete(`${API_URL}/${id}`);
};


