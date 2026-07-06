import api from "../apiClient";

const ITEM_UNIT_API_URL = "/item-units";

// Create ItemUnit
export const createItemUnit = async (itemUnitData: any) => {
  try {
    const response = await api.post(ITEM_UNIT_API_URL, itemUnitData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get all ItemUnits
export const getItemUnits = async () => {
  try {
    const response = await api.get(ITEM_UNIT_API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Get single ItemUnit by id
export const getItemUnit = async (id: number | string) => {
  try {
    const response = await api.get(`${ITEM_UNIT_API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Update ItemUnit by id
export const updateItemUnit = async (id: number | string, itemUnitData: any) => {
  try {
    const response = await api.put(`${ITEM_UNIT_API_URL}/${id}`, itemUnitData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

// Delete ItemUnit by id
export const deleteItemUnit = async (id: number | string) => {
  try {
    const response = await api.delete(`${ITEM_UNIT_API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


