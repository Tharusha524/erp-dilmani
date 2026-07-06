import api from "../apiClient";

const API_URL = "/chart-classes";

export const createChartClass = async (chartClassData: any) => {
  try {
    const response = await api.post(API_URL, chartClassData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getChartClasses = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getChartClass = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateChartClass = async (id: string | number, chartClassData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, chartClassData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteChartClass = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


