import api from "../apiClient";

const API_URL = "/account-tags"; 

// Create
export const createAccountTag = async (tagData: any) => {
  try {
    const response = await api.post(API_URL, tagData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read all
export const getAccountTags = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read one
export const getAccountTag = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update
export const updateAccountTag = async (
  id: string | number,
  tagData: any
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, tagData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete
export const deleteAccountTag = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


