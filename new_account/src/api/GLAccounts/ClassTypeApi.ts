import api from "../apiClient";

const API_URL = "/class-types";

export const createClassType = async (classTypeData: any) => {
  try {
    const response = await api.post(API_URL, classTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getClassTypes = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getClassType = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateClassType = async (id: string | number, classTypeData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, classTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteClassType = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


