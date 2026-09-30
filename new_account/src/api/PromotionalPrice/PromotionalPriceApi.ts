import api from "../apiClient";

const API_URL = "/promotional-prices";

export interface PromotionalPricePayload {
  stock_id: string;
  promo_price: number;
  start_date: string;
  end_date: string;
}

export const getPromotionalPrices = async (params?: { stock_id?: string; active_only?: boolean }) =>
  (await api.get(API_URL, { params })).data;

export const createPromotionalPrice = async (data: PromotionalPricePayload) =>
  (await api.post(API_URL, data)).data;

export const updatePromotionalPrice = async (id: number | string, data: Partial<PromotionalPricePayload> & { active?: boolean }) =>
  (await api.put(`${API_URL}/${id}`, data)).data;

export const deletePromotionalPrice = async (id: number | string) =>
  (await api.delete(`${API_URL}/${id}`)).data;
