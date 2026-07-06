import api from "../apiClient";

const API_URL = "/sales-pricings"; 

// Create
export const createSalesPricing = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read all (with relations if backend supports it)
export const getSalesPricing = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read by stock_id
export const getSalesPricingByStockId = async (stockId: string | number) => {
  try {
    const response = await api.get(`${API_URL}?stock_id=${stockId}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Read one
export const getSalesPricingById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update
export const updateSalesPricing = async (
  id: string | number,
  data: any
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete
export const deleteSalesPricing = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


