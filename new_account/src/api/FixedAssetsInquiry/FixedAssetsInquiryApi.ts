import api from "../apiClient";

export const searchFixedAssets = async (params: { showInactive?: boolean }) => {
  const { data } = await api.post("/fixed-assets-inquiry/search", params);
  return data;
};

export const searchFixedAssetMovements = async (params: {
  stockId?: string;
  location?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const { data } = await api.post("/fixed-assets-inquiry/movements", params);
  return data;
};

