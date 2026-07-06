import api from "../apiClient";

const API_URL = "/depreciation-periods";

// GET all Depreciation Periods
export const getDepreciationPeriods = async () => {
  return await api.get(API_URL);
};

// GET single Depreciation Period by ID
export const getDepreciationPeriod = async (id) => {
  return await api.get(`${API_URL}/${id}`);
};

// CREATE new Depreciation Period
export const createDepreciationPeriod = async (data) => {
  return await api.post(API_URL, data);
};

// UPDATE Depreciation Period
export const updateDepreciationPeriod = async (id, data) => {
  return await api.put(`${API_URL}/${id}`, data);
};

// DELETE Depreciation Period
export const deleteDepreciationPeriod = async (id) => {
  return await api.delete(`${API_URL}/${id}`);
};


