import api from "../apiClient";

export interface CostedBomLine {
  component: string;
  description: string;
  work_centre: string;
  location: string;
  quantity: number;
  unit_cost: number;
  cost: number;
}

export interface CostedBomResult {
  parent: string;
  parent_description: string;
  lines: CostedBomLine[];
  labour_cost: number;
  overhead_cost: number;
  total_cost: number;
  currency: string;
}

export interface WhereUsedRow {
  parent: string;
  parent_label: string;
  work_centre: string;
  location: string;
  quantity: number;
}

export const getCostedBom = async (stockId: string): Promise<CostedBomResult> => {
  const response = await api.get("/manufacturing/inquiries/costed-bom", {
    params: { stock_id: stockId },
  });
  return response.data;
};

export const getWhereUsed = async (stockId: string): Promise<WhereUsedRow[]> => {
  const response = await api.get("/manufacturing/inquiries/where-used", {
    params: { stock_id: stockId },
  });
  return response.data;
};
