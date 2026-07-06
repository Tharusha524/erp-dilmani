// api/salesPersonApi.ts
import api from "../apiClient";

const API_URL = "/sales-persons";

// Define TypeScript interface
export interface SalesPerson {
  id?: number; // optional for creation
  name: string;
  telephone?: string | null;
  fax?: string | null;
  email?: string | null;
  provision: number;
  turnover_break_point: number;
  provision2: number;
}

// Create a new sales person
export const createSalesPerson = async (salesPersonData: SalesPerson): Promise<SalesPerson> => {
  try {
    const response = await api.post(API_URL, salesPersonData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all sales persons
export const getSalesPersons = async (): Promise<SalesPerson[]> => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get a single sales person by ID
export const getSalesPerson = async (id: string | number): Promise<SalesPerson> => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update a sales person
export const updateSalesPerson = async (id: string | number, salesPersonData: SalesPerson): Promise<SalesPerson> => {
  try {
    const response = await api.put(`${API_URL}/${id}`, salesPersonData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete a sales person
export const deleteSalesPerson = async (id: string | number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


