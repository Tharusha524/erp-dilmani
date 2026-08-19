import api from "../apiClient";

export interface StandaloneStockItem {
  id: number;
  item_name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export const getStandaloneStocks = async (): Promise<StandaloneStockItem[]> => {
  const response = await api.get("/standalone-stocks");
  return response.data;
};

export const addStandaloneStockQuantity = async (id: number, quantity: number) => {
  const response = await api.post("/standalone-stocks/in", { id, quantity });
  return response.data;
};

export const deductStandaloneStockQuantity = async (id: number, quantity: number) => {
  const response = await api.post("/standalone-stocks/out", { id, quantity });
  return response.data;
};

export const createStandaloneStockItem = async (item_name: string, quantity: number) => {
  const response = await api.post("/standalone-stocks", { item_name, quantity });
  return response.data;
};

export const updateStandaloneStockItem = async (id: number, item_name: string, quantity: number) => {
  const response = await api.put(`/standalone-stocks/${id}`, { item_name, quantity });
  return response.data;
};

export const deleteStandaloneStockItem = async (id: number) => {
  const response = await api.delete(`/standalone-stocks/${id}`);
  return response.data;
};
