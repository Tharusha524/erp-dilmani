import api from "../apiClient";

const API_URL = "/suppliers";

//  Create supplier
export const createSupplier = async (supplierData: any) => {
  try {
    const response = await api.post(API_URL, supplierData);
    return response.data;
  } catch (error: any) {
    console.error("Create Supplier Error:", error.response?.data || error);
    throw error;
  }
};

//  Get all suppliers
export const getSuppliers = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error("Get Suppliers Error:", error.response?.data || error);
    throw error;
  }
};

//  Get supplier by ID
export const getSupplierById = async (id: number | string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Get Supplier Error:", error.response?.data || error);
    throw error;
  }
};

//  Update supplier
export const updateSupplier = async (id: number | string, supplierData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, supplierData);
    return response.data;
  } catch (error: any) {
    console.error("Update Supplier Error:", error.response?.data || error);
    throw error;
  }
};

//  Delete supplier
export const deleteSupplier = async (id: number | string) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Delete Supplier Error:", error.response?.data || error);
    throw error;
  }
};


