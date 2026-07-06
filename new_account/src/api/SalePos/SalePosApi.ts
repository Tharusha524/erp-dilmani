// api/salesPosApi.ts
import api from "../apiClient";

const API_URL = "/sales-points";

// TypeScript Interface
export interface SalesPos {
  pos_name: string;
  cash_sale: boolean;
  credit_sale: boolean;
  pos_location: string;  
  pos_account: number; 
  inactive: boolean;
}

// Create a new POS
export const createSalesPos = async (data: SalesPos): Promise<SalesPos> => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all POS
export const getSalesPosList = async (): Promise<SalesPos[]> => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get single POS by ID
export const getSalesPos = async (id: number | string): Promise<SalesPos> => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update POS
export const updateSalesPos = async (
  id: number | string,
  data: SalesPos
): Promise<SalesPos> => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete POS
export const deleteSalesPos = async (
  id: number | string
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


