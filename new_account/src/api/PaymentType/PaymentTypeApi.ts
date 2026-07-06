// PaymentTypeApi.ts
import api from "../apiClient";

export const getPaymentTypes = async () => {
  const response = await api.get("/payment-types");
  return response.data; // adjust depending on your API response format
};


