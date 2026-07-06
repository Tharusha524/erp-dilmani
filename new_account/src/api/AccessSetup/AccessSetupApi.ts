import api from "../apiClient";

const API_URL = "/security-roles"; 

// Create
export const createSecurityRole = async (roleData: any) => {
  try {
    const response = await api.post(API_URL, roleData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read all
export const getSecurityRoles = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read one
export const getSecurityRole = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update
export const updateSecurityRole = async (
  id: string | number,
  roleData: any
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, roleData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete
export const deleteSecurityRole = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


