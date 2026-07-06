import api from "../apiClient";

const API_URL = "/fixed-assets-locations";

export const createLocation = async (locationData: any) => {
  try {
    const response = await api.post(API_URL, locationData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getLocations = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getLocation = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateLocation = async (id: string | number, locationData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, locationData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteLocation = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


