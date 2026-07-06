import api from "../apiClient";

export interface FaDepreciationPreviewLine {
  stock_id: string;
  description: string;
  depreciation_method: string;
  depreciation_rate: number;
  asset_cost: number;
  accumulated_depreciation: number;
  book_value: number;
  depreciation_amount: number;
  expense_account: string;
  accumulated_account: string;
  asset_account: string;
  depreciation_start: string | null;
  last_depreciation_date: string | null;
  already_posted: boolean;
  selected: boolean;
}

export interface FaDepreciationPreview {
  period_date: string;
  period_key: string;
  periods_per_year: number;
  lines: FaDepreciationPreviewLine[];
  total_amount: number;
  asset_count: number;
}

export interface FaDepreciationProcessResult {
  message: string;
  reference?: string;
  total_amount?: number;
  batch?: {
    id: number;
    reference: string;
    period_date: string;
    assets_count: number;
    total_amount: number;
  };
  lines?: FaDepreciationPreviewLine[];
}

export const previewFaDepreciation = async (periodDate: string): Promise<FaDepreciationPreview> => {
  const { data } = await api.post<FaDepreciationPreview>("/fa-depreciation/preview", {
    period_date: periodDate,
  });
  return data;
};

export const processFaDepreciation = async (payload: {
  period_date: string;
  reference?: string;
  stock_ids?: string[];
}): Promise<FaDepreciationProcessResult> => {
  const { data } = await api.post<FaDepreciationProcessResult>("/fa-depreciation/process", payload);
  return data;
};

