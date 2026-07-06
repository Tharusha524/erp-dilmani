import api from "../apiClient";

const API_URL = "/debtors-master";

// ✅ Create
export const createCustomer = async (customerData: any) => {
  try {
    const response = await api.post(API_URL, customerData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// ✅ Get all customers
export const getCustomers = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// ✅ Get single customer by ID
export const getCustomer = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// ✅ Update customer
export const updateCustomer = async (id: string | number, customerData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, customerData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// ✅ Delete customer
export const deleteCustomer = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getCustomerContacts = async (customerId: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${customerId}`);
    return response.data.contacts || [];
  } catch (error: any) {
    console.error("Failed to fetch contacts:", error.response || error);
    return [];
  }
};

