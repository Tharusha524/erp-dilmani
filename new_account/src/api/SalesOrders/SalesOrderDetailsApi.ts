import api from "../apiClient";

const API_URL = "/sales-order-details";

export const getSalesOrderDetails = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching sales order details:", error);
    return [];
  }
};

export const getSalesOrderDetailById = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sales order detail ${id}:`, error);
    return null;
  }
};

export const getSalesOrderDetailsByOrderNo = async (orderNo: string | number) => {
  try {
    const response = await api.get(API_URL);
    const allDetails = response.data;
    return allDetails.filter((detail: any) => String(detail.order_no) === String(orderNo));
  } catch (error) {
    console.error(`Error fetching sales order details for order ${orderNo}:`, error);
    return [];
  }
};

export const createSalesOrderDetail = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating sales order detail:", error.response?.data || error);
    throw error;
  }
};

export const updateSalesOrderDetail = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating sales order detail ${id}:`, error.response?.data || error);
    throw error;
  }
};

export const deleteSalesOrderDetail = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting sales order detail ${id}:`, error.response?.data || error);
    throw error;
  }
};


