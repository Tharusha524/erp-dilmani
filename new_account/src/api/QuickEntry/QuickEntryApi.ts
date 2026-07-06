import api from "../apiClient";

export interface QuickEntry {
  id: number;
  name: string;
  description?: string;
  usage?: string;
  entry_type?: string;
  base_amount_description?: string;
  default_base_amount?: number;
  destination_account?: string;
}

export const getQuickEntries = async (): Promise<QuickEntry[]> => {
  const { data } = await api.get("/quick-entries");
  return data;
};

export const getQuickEntry = async (id: number): Promise<QuickEntry> => {
  const { data } = await api.get(`/quick-entries/${id}`);
  return data;
};

export const createQuickEntry = async (payload: Omit<QuickEntry, "id">) => {
  const { data } = await api.post("/quick-entries", payload);
  return data;
};

export const updateQuickEntry = async (id: number, payload: Partial<QuickEntry>) => {
  const { data } = await api.put(`/quick-entries/${id}`, payload);
  return data;
};

export const deleteQuickEntry = async (id: number) => {
  await api.delete(`/quick-entries/${id}`);
};

