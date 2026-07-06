import api from "../apiClient";

// Interface for ItemTaxTypeExemption
export interface ItemTaxTypeExemption {
  item_tax_type_id: number;
  tax_type_id: number;
}

// Base API URL
const API_URL = "/item-tax-type-exceptions";

//  Create a new exemption
export const createItemTaxTypeExemption = async (data: ItemTaxTypeExemption) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating tax type exception:', error.response?.data || error);
    throw error;
  }
};

//  Get all exemptions
export const getItemTaxTypeExemptions = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

//  Get a specific exemption by item_tax_type_id and tax_type_id
export const getItemTaxTypeExemption = async (
  itemTaxTypeId: number,
  taxTypeId: number
) => {
  const response = await api.get(`${API_URL}/${itemTaxTypeId}/${taxTypeId}`);
  return response.data;
};

//  Delete a specific exemption
export const deleteItemTaxTypeExemption = async (
  itemTaxTypeId: number,
  taxTypeId: number
) => {
  const response = await api.delete(`${API_URL}/${itemTaxTypeId}/${taxTypeId}`);
  return response.data;
};


