import api from "../apiClient";

export interface StockListItem {
  stock_id: string;
  description: string;
  category_id: number | null;
  category_name: string | null;
  purchase_cost: number;
  quantity: number;
  barcode: string | null;
}

export const getStockList = async (params?: { search?: string; category_id?: number | string }) => {
  const response = await api.get<StockListItem[]>("/inventory/stock-list", { params });
  return response.data;
};
