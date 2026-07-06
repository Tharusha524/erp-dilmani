import api from "../apiClient";

export const getStockQoh = async (stockId: string, locCode?: string): Promise<number> => {
  const { data } = await api.get<{ qty: number }>("/inventory/qoh", {
    params: { stock_id: stockId, loc_code: locCode || undefined },
  });
  return data.qty ?? 0;
};

