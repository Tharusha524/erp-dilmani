import api from "../apiClient";

const API_URL = "/gl-types";

// GET all GL Types
export const getGlTypes = async () => {
  return await api.get(API_URL);
};

// GET single GL Type by ID
export const getGlType = async (id) => {
  return await api.get(`${API_URL}/${id}`);
};

// CREATE new GL Type
export const createGlType = async (data) => {
  return await api.post(API_URL, data);
};

// UPDATE GL Type
export const updateGlType = async (id, data) => {
  return await api.put(`${API_URL}/${id}`, data);
};

// DELETE GL Type
export const deleteGlType = async (id) => {
  return await api.delete(`${API_URL}/${id}`);
};


