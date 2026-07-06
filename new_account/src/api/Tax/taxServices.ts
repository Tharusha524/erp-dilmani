import api from "../apiClient";

//TAX TYPES API
const TAX_TYPES_API_URL = "/tax-types";

export const createTaxType = async (taxTypeData: any) => {
  try {
    const response = await api.post(TAX_TYPES_API_URL, taxTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getTaxTypes = async () => {
  try {
    const response = await api.get(TAX_TYPES_API_URL);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getTaxType = async (id: string | number) => {
  try {
    const response = await api.get(`${TAX_TYPES_API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateTaxType = async (
  id: string | number,
  taxTypeData: any
) => {
  try {
    const response = await api.put(`${TAX_TYPES_API_URL}/${id}`, taxTypeData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteTaxType = async (id: string | number) => {
  try {
    const response = await api.delete(`${TAX_TYPES_API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


//TAX GROUPS API
const TAX_GROUPS_API_URL = "/tax-groups";

export interface TaxGroup {
  id?: number;               // optional for create
  description: string;
}

// --------------------
// API Functions
// --------------------

// Create Tax Group
export const createTaxGroup = async (data: TaxGroup): Promise<TaxGroup> => {
  const response = await api.post<TaxGroup>(TAX_GROUPS_API_URL, data);
  return response.data;
};

// Get all Tax Groups
export const getTaxGroups = async (): Promise<TaxGroup[]> => {
  const response = await api.get<TaxGroup[]>(TAX_GROUPS_API_URL);
  return response.data;
};

// Get single Tax Group by ID
export const getTaxGroup = async (id: number): Promise<TaxGroup> => {
  const response = await api.get<TaxGroup>(`${TAX_GROUPS_API_URL}/${id}`);
  return response.data;
};

// Update Tax Group
export const updateTaxGroup = async (
  id: number,
  data: TaxGroup
): Promise<TaxGroup> => {
  const response = await api.put<TaxGroup>(`${TAX_GROUPS_API_URL}/${id}`, data);
  return response.data;
};

// Delete Tax Group
export const deleteTaxGroup = async (id: number): Promise<{ success: boolean }> => {
  const response = await api.delete<{ success: boolean }>(`${TAX_GROUPS_API_URL}/${id}`);
  return response.data;
};



