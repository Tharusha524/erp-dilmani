import api from "../apiClient";

const API_URL = "/cust-allocations";

// GET all Depreciation Methods
export const getCustAllocations = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching customer allocations:", error);
    return [];
  }
};

// GET single Depreciation Method by ID
export const getCustAllocation = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer allocation ${id}:`, error);
    return null;
  }
};

// CREATE new Depreciation Method
export const createCustAllocation = async (data) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error creating customer allocation:", error);
    throw error;
  }
};

// UPDATE Depreciation Method
export const updateCustAllocation = async (id, data) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer allocation ${id}:`, error);
    throw error;
  }
};

// DELETE Depreciation Method
export const deleteCustAllocation = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer allocation ${id}:`, error);
    throw error;
  }
};


