// src/api/ItemTypeApi.ts
import api from "../apiClient";


const API_URL = "/item-types"; // adjust if needed

interface ItemType {
  id?: number;       // optional for creation
  name: string;
  inactive?: boolean;
}


// Get all item types
export const getItemTypes = async (): Promise<ItemType[]> => {
  const response = await api.get<ItemType[]>(API_URL);
  return response.data;
};

// Get single item type by ID
export const getItemType = async (id: number): Promise<ItemType> => {
  const response = await api.get<ItemType>(`${API_URL}/${id}`);
  return response.data;
};

// Create new item type
export const createItemType = async (data: ItemType): Promise<ItemType> => {
  const response = await api.post<ItemType>(API_URL, data);
  return response.data;
};

// Update item type
export const updateItemType = async (id: number, data: Partial<ItemType>): Promise<ItemType> => {
  const response = await api.put<ItemType>(`${API_URL}/${id}`, data);
  return response.data;
};

// Delete item type
export const deleteItemType = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};


