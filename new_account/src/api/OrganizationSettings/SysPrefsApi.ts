import api from "../apiClient";

const API_URL = "/sys-prefs";

export interface SysPref {
  name: string;
  category: string;
  type: string;
  length: number | null;
  value: string;
}

export const getSysPrefs = async (): Promise<SysPref[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const updateSysPref = async (name: string, value: string): Promise<void> => {
  await api.put(`${API_URL}/${encodeURIComponent(name)}`, { value });
};

/**
 * Bulk upsert system preferences (creates rows if missing).
 */
export const bulkUpdateSysPrefs = async (prefs: Record<string, string>): Promise<void> => {
  await api.post(`${API_URL}/bulk`, { prefs });
};

