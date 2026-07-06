import api from "../apiClient";

const SUPP_ALLOCATIONS_URL = "/supp-allocations";

export interface SuppAllocationPayload {
  person_id: number | null;
  amount: number | null;
  date_alloc: string;
  trans_no_from: number | null;
  trans_type_from: number | null;
  trans_no_to: number | null;
  trans_type_to: number | null;
}

export const getSuppAllocations = async () => {
  try {
    const response = await api.get(SUPP_ALLOCATIONS_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier allocations:", error);
    return [];
  }
};

export const getSuppAllocationById = async (id: string | number) => {
  try {
    const response = await api.get(`${SUPP_ALLOCATIONS_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplier allocation ${id}:`, error);
    return null;
  }
};

export const createSuppAllocation = async (
  payload: SuppAllocationPayload
) => {
  try {
    const response = await api.post(SUPP_ALLOCATIONS_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating supplier allocation:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updateSuppAllocation = async (
  id: string | number,
  payload: SuppAllocationPayload
) => {
  try {
    const response = await api.put(
      `${SUPP_ALLOCATIONS_URL}/${id}`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating supplier allocation ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deleteSuppAllocation = async (id: string | number) => {
  try {
    const response = await api.delete(`${SUPP_ALLOCATIONS_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting supplier allocation ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};


