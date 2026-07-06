import api from "../apiClient";

const API_URL = "/shipping-companies";

export interface ShippingCompany {
  shipper_id?: number; // optional for create
  shipper_name: string;
  phone: string;
  phone2: string;
  contact: string;
  address: string;
  inactive?: boolean;
}

// Create
export const createShippingCompany = async (data: ShippingCompany): Promise<ShippingCompany> => {
  const response = await api.post<ShippingCompany>(API_URL, data);
  return response.data;
};

// Get all
export const getShippingCompanies = async (): Promise<ShippingCompany[]> => {
  const response = await api.get<ShippingCompany[]>(API_URL);
  return response.data;
};

// Get single by ID
export const getShippingCompany = async (shipper_id: number): Promise<ShippingCompany> => {
  const response = await api.get<ShippingCompany>(`${API_URL}/${shipper_id}`);
  return response.data;
};

// Update
export const updateShippingCompany = async (shipper_id: number, data: ShippingCompany): Promise<ShippingCompany> => {
  const response = await api.put<ShippingCompany>(`${API_URL}/${shipper_id}`, data);
  return response.data;
};

// Delete
export const deleteShippingCompany = async (shipper_id: number): Promise<{ success: boolean }> => {
  const response = await api.delete<{ success: boolean }>(`${API_URL}/${shipper_id}`);
  return response.data;
};


