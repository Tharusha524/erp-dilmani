import api from "../apiClient";

// Interface for CRM Contact
export interface CrmContact {
  id: number;          // auto-generated
  person_id: number;   // required
  type: number;        // required
  action: string;      // required
  entity_id?: string;  // optional
}

// Payload for creating/updating (exclude `id` for creation)
export interface CrmContactPayload {
  person_id: number;
  type: number;
  action: string;
  entity_id?: string;
}

// Base URL for backend API (replace with your actual endpoint)
const BASE_URL = "/crm-contacts";

// ---------------- CRUD FUNCTIONS ---------------- //

//  Create a new CRM contact
export const createCrmContact = async (payload: CrmContactPayload): Promise<CrmContact> => {
  try {
    const response = await api.post(BASE_URL, payload);
    return response.data; // backend returns the created object including auto-generated id
  } catch (error: any) {
    console.error("Error creating CRM contact:", error);
    throw error;
  }
};

//  Get all CRM contacts
export const getCrmContactsBySupplier = async (supplierId: string | number): Promise<CrmContact[]> => {
  try {
    const response = await api.get(`${BASE_URL}?supplierId=${supplierId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching CRM contacts for supplier ${supplierId}:`, error);
    return [];
  }
};

//  Get a single CRM contact by ID
export const getCrmContactById = async (id: number): Promise<CrmContact> => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching CRM contact with id ${id}:`, error);
    throw error;
  }
};

//  Update a CRM contact by ID
export const updateCrmContact = async (id: number, payload: CrmContactPayload): Promise<CrmContact> => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating CRM contact with id ${id}:`, error);
    throw error;
  }
};

//  Delete a CRM contact by ID
export const deleteCrmContact = async (id: number): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/${id}`);
  } catch (error: any) {
    console.error(`Error deleting CRM contact with id ${id}:`, error);
    throw error;
  }
};


