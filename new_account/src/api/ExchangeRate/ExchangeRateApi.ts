// src/api/ExchangeRate/exchangeRateApi.ts
import api from "../apiClient";

export interface ExchangeRate {
  id: number;
  date: string;
  rate_buy: number;
  rate_sell?: number;
  curr_code: string;
}

const API_URL = "/exchange-rates";

export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const createExchangeRate = async (
  data: Partial<ExchangeRate>
): Promise<ExchangeRate> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateExchangeRate = async (
  id: number | string,
  data: Partial<ExchangeRate>
): Promise<ExchangeRate> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteExchangeRate = async (id: number | string): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};


