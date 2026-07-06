import api from "../apiClient";

const API_URL = "/user-profiles";

export const createUser = async (userData: FormData) => {
  try {
    const response = await api.post(API_URL, userData, {
      headers: {
        "Content-Type": "multipart/form-data", // required for file upload
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getUser = async (id: string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, userData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteUser = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


