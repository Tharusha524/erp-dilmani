import api from "../apiClient";

// src/interfaces/TaxGroupItem.ts
export interface TaxGroupItem {
  tax_group_id: number;
  tax_type_id: number;
  tax_shipping: boolean;
}


const API_URL = "/tax-group-items"; // Adjust if needed

//  Create a new Tax Group Item
export const createTaxGroupItem = async (data: TaxGroupItem) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

//  Get all Tax Group Items
export const getTaxGroupItems = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

//  Get all Tax Group Items by Tax Group ID
export const getTaxGroupItemsByGroupId = async (groupId: number) => {
  // Use query parameter to filter by tax_group_id
  const response = await api.get(`${API_URL}`, {
    params: {
      tax_group_id: groupId
    }
  });
  return response.data;
};

//  Update an existing Tax Group Item
export const updateTaxGroupItem = async (
  taxGroupId: number,
  taxTypeId: number,
  data: Partial<TaxGroupItem>
) => {
  // Use query parameters to identify the record and send full update data
  const response = await api.put(`${API_URL}/${taxGroupId}/${taxTypeId}`, {
    tax_group_id: taxGroupId,
    tax_type_id: taxTypeId,
    tax_shipping: data.tax_shipping
  });
  return response.data;
};

//  Delete a Tax Group Item
export const deleteTaxGroupItem = async (taxGroupId: number, taxTypeId: number) => {
  const response = await api.delete(`${API_URL}/${taxGroupId}/${taxTypeId}`);
  return response.data;
};




