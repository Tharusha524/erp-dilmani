// src/api/CurrencyRevaluationApi.ts
import api from "../apiClient";

export interface RevaluateCurrenciesPayload {
  date: Date; // "YYYY-MM-DD"
  memo: string;
}

const API_URL = "/revaluate-currencies";

export const revaluateCurrencies = async (data: RevaluateCurrenciesPayload) => {
  const response = await api.post(API_URL, data);
  return response.data;
};


