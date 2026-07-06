import api from "../apiClient";

const API_URL = "/chart-masters";

export const createChartMaster = async (chartMasterData: Record<string, unknown>) => {
  try {
    const response = await api.post(API_URL, chartMasterData);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating chart master:", error);
    throw error;
  }
};

export const getChartMasters = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching chart masters:", error);
    throw error;
  }
};

export const getChartMaster = async (id: string | number) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error fetching chart master ${id}:`, error);
    throw error;
  }
};

export const updateChartMaster = async (
  id: string | number,
  chartMasterData: Record<string, unknown>
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, chartMasterData);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating chart master ${id}:`, error);
    throw error;
  }
};

export const deleteChartMaster = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error deleting chart master ${id}:`, error);
    throw error;
  }
};
