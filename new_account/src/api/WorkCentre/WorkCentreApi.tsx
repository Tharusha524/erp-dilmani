import api from "../apiClient";

const API_URL = "/work-centres"; 

// Create WorkCentre
export const createWorkCentre = async (workCentreData: any) => {
  try {
    const response = await api.post(API_URL, workCentreData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all WorkCentres
export const getWorkCentres = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get single WorkCentre by ID
export const getWorkCentre = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update WorkCentre
export const updateWorkCentre = async (id: string | number, workCentreData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, workCentreData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete WorkCentre
export const deleteWorkCentre = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


