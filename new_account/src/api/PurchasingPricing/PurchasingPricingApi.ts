import api from "../apiClient";

const API_URL = "/purchasing-pricings"; // adjust if needed

export interface PurchData {
  supplier_id: number;
  stock_id: string;
  price: number;
  suppliers_uom: string;
  conversion_factor: number;
  supplier_description?: string;
}

/**
 * Get all purchase data
 */
export const getPurchData = async (stockId?: string | number): Promise<PurchData[]> => {
  try {
    const url = stockId != null && stockId !== ""
      ? `${API_URL}?stock_id=${encodeURIComponent(String(stockId))}`
      : API_URL;
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/**
 * Get a single purchase data record by supplier_id and stock_id
 */
export const getPurchDataById = async (
  supplier_id: number,
  stock_id: string
): Promise<PurchData> => {
  try {
    const response = await api.get(`${API_URL}/${supplier_id}/${stock_id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/**
 * Create a new purchase data record
 */
export const createPurchData = async (data: PurchData): Promise<void> => {
  try {
    await api.post(API_URL, data);
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/**
 * Update an existing purchase data record
 */
export const updatePurchData = async (
  supplier_id: number,
  stock_id: string,
  data: PurchData
): Promise<void> => {
  try {
    await api.put(`${API_URL}/${supplier_id}/${stock_id}`, data);
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/**
 * Delete a purchase data record
 */
export const deletePurchData = async (
  supplier_id: number,
  stock_id: string
): Promise<void> => {
  try {
    await api.delete(`${API_URL}/${supplier_id}/${stock_id}`);
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


