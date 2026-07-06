import api from "../apiClient";

const API_URL = "/purch-order-details";

export const getPurchOrderDetails = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase order details:", error);
    return [];
  }
};

export const getPurchOrderDetailById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase order detail ${id}:`, error);
    return null;
  }
};

export const getPurchOrderDetailsByOrderNo = async (
  orderNo: string | number
) => {
  try {
    const response = await api.get(`/purch-orders/${orderNo}/details`);
    const data = response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      `Error fetching purchase order details for order ${orderNo}:`,
      error
    );
    return [];
  }
};

export const createPurchOrderDetail = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating purchase order detail:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updatePurchOrderDetail = async (
  id: string | number,
  data: any
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating purchase order detail ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deletePurchOrderDetail = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting purchase order detail ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};


