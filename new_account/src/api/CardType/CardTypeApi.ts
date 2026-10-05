import api from "../apiClient";

const API_URL = "/card-types";

export const getCardTypes = async () => (await api.get(API_URL)).data;
export const createCardType = async (data: { name: string }) => (await api.post(API_URL, data)).data;
export const updateCardType = async (id: number | string, data: { name: string }) =>
  (await api.put(`${API_URL}/${id}`, data)).data;
export const deleteCardType = async (id: number | string) => (await api.delete(`${API_URL}/${id}`)).data;

export const tagPaymentCardType = async (data: {
  debtor_trans_no: number;
  debtor_trans_type: number;
  bank_account_id?: number;
  card_type_id: number;
}) => (await api.post(`${API_URL}/tag-payment`, data)).data;
