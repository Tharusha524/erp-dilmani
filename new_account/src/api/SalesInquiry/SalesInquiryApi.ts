import api from "../apiClient";

export const getSalesQuotationInquiry = async (params?: Record<string, unknown>) => {
  const response = await api.get("/sales/inquiries/quotations", { params });
  return response.data;
};

export const getSalesOrderInquiry = async (params?: Record<string, unknown>) => {
  const response = await api.get("/sales/inquiries/orders", { params });
  return response.data;
};

export const getCustomerTransactionInquiry = async (params?: Record<string, unknown>) => {
  const response = await api.get("/sales/inquiries/customer-transactions", { params });
  return response.data;
};

export const getCustomerAllocationInquiry = async (params?: Record<string, unknown>) => {
  const response = await api.get("/sales/inquiries/customer-allocations", { params });
  return response.data;
};

export const dispatchTemplateDelivery = async (orderNo: number, payload?: Record<string, unknown>) => {
  const response = await api.post(`/sales/delivery/template/${orderNo}`, payload ?? {});
  return response.data;
};

export const directInvoiceFromTemplate = async (orderNo: number, payload?: Record<string, unknown>) => {
  const response = await api.post(`/sales/invoice/template/${orderNo}`, payload ?? {});
  return response.data;
};

export const prepaidFinalInvoice = async (orderNo: number, payload?: Record<string, unknown>) => {
  const response = await api.post(`/sales/invoice/prepaid-final/${orderNo}`, payload ?? {});
  return response.data;
};
