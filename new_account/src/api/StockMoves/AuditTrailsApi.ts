import api from "../apiClient";

const API_URL = "/audit-trails";

export const getAuditTrails = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit trails:", error);
    return [];
  }
};

export const getAuditTrailById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching audit trail ${id}:`, error);
    return null;
  }
};

export const createAuditTrail = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating audit trail:", error.response?.data || error);
    throw error;
  }
};

export const updateAuditTrail = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating audit trail ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteAuditTrail = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting audit trail ${id}:`, error.response?.data || error);
    throw error;
  }
};


