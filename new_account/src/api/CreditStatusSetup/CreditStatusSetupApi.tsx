import api from "../apiClient";

const API_URL = "/credit-status-setup";

// Interface for CreditStatusSetup
export interface CreditStatusSetup {
  id?: number; 
  reason_description: string;
  disallow_invoices: boolean;
  // backend accepts numeric 1/0 for inactive; allow boolean or number in types
  inactive?: boolean | number;
}

// Create CreditStatusSetup
export const createCreditStatusSetup = async (data: CreditStatusSetup) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all CreditStatusSetups
export const getCreditStatusSetups = async (): Promise<CreditStatusSetup[]> => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get single CreditStatusSetup by ID
export const getCreditStatusSetup = async (id: number): Promise<CreditStatusSetup> => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update CreditStatusSetup
export const updateCreditStatusSetup = async (id: number, data: CreditStatusSetup) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete CreditStatusSetup
export const deleteCreditStatusSetup = async (id: number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


