import api from "../apiClient";

const API_URL = "/stock-fa-classes";

/* TypeScript interface */
export interface StockFaClass {
  fa_class_id: string;          // primary key (string)
  parent_id: string;
  description: string;
  long_description: string;
  depreciation_rate: number;
  inactive: boolean;
}

/* Create a new FA class */
export const createStockFaClass = async (
  data: StockFaClass
): Promise<StockFaClass> => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/* Get all FA classes */
export const getStockFaClasses = async (): Promise<StockFaClass[]> => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/* Get single FA class */
export const getStockFaClass = async (
  faClassId: string
): Promise<StockFaClass> => {
  try {
    const response = await api.get(`${API_URL}?fa_class_id=${faClassId}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/* Update FA class */
export const updateStockFaClass = async (
  faClassId: string,
  data: StockFaClass
): Promise<StockFaClass> => {
  try {
    const response = await api.put(
      `${API_URL}/${faClassId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

/* Delete FA class */
export const deleteStockFaClass = async (
  faClassId: string
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(
      `${API_URL}/${faClassId}`
    );
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


