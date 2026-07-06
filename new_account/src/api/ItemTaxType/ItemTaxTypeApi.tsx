import api from "../apiClient";

const API_URL = "/item-tax-types"; 

// Create ItemTaxType
export const createItemTaxType = async (itemTaxTypeData: any) => {
  try {
    const response = await api.post(API_URL, itemTaxTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all ItemTaxTypes
export const getItemTaxTypes = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get single ItemTaxType by ID
export const getItemTaxType = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update ItemTaxType
export const updateItemTaxType = async (id: string | number, itemTaxTypeData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, itemTaxTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete ItemTaxType
export const deleteItemTaxType = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


