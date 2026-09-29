import api from "../apiClient";

export interface StockListItem {
  stock_id: string;
  description: string;
  category_id: number | null;
  category_name: string | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  purchase_cost: number;
  mrp_price: number | null;
  quantity: number;
  barcode: string | null;
}

export const getStockList = async (params?: {
  search?: string;
  category_id?: number | string;
  brand_id?: number | string;
  subcategory_id?: number | string;
}) => {
  const response = await api.get<StockListItem[]>("/inventory/stock-list", { params });
  return response.data;
};
