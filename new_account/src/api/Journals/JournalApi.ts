import api, { type ApiRequestConfig } from "../apiClient";

const API_URL = "/journals";

export interface JournalPayload {
  type: number;          // reflines.trans_type
  trans_no: number;
  tran_date?: string;
  reference?: string;
  source_ref?: string;
  event_date?: string;
  doc_date?: string;
  currency?: string;
  amount: number;
  rate?: number;
}

export const getJournals = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching journals:", error);
    return [];
  }
};

export const getJournalById = async (id: number | string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching journal ${id}:`, error);
    return null;
  }
};

export const getJournalsByTransNo = async (transNo: number, type?: number) => {
  try {
    const response = await api.get(API_URL);
    return response.data.filter((row: any) => {
      if (Number(row.trans_no) !== Number(transNo)) return false;
      if (type != null && Number(row.type) !== Number(type)) return false;
      return true;
    });
  } catch (error) {
    console.error("Error filtering journals:", error);
    return [];
  }
};

export const searchJournals = async (filters: {
  reference?: string;
  type?: number | string;
  fromDate?: string;
  toDate?: string;
  memo?: string;
}) => {
  try {
    const response = await api.post(`${API_URL}/search`, filters);
    return response.data;
  } catch (error) {
    console.error("Error searching journals:", error);
    return [];
  }
};

export const createJournal = async (
  payload: JournalPayload,
  options?: { skipErrorDialog?: boolean }
) => {
  try {
    const config: ApiRequestConfig = {
      skipErrorDialog: options?.skipErrorDialog === true,
    };
    const response = await api.post(API_URL, payload, config);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating journal:",
      error.response?.data || error
    );
    throw error;
  }
};

export const updateJournal = async (
  id: number | string,
  payload: JournalPayload
) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, payload);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error updating journal ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

export const deleteJournal = async (id: number | string) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `Error deleting journal ${id}:`,
      error.response?.data || error
    );
    throw error;
  }
};

/** Void posted GL transaction (FA-style reversing entries + audit). */
export const deleteJournalTransaction = async (
  transType: number | string,
  transNo: number | string,
  options?: { void_date?: string; memo?: string }
) => {
  const response = await api.delete(`${API_URL}/trans/${transType}/${transNo}`, {
    data: options,
  });
  return response.data;
};


