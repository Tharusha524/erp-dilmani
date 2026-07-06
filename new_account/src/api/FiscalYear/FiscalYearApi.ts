import api from "../apiClient";

const API_URL = "/fiscal-years";

function normalizeFiscalYear(fy: Record<string, unknown>) {
  const closed =
    fy.closed === true ||
    fy.closed === 1 ||
    fy.closed === "1" ||
    fy.isClosed === true ||
    fy.isClosed === 1;

  return {
    ...fy,
    closed,
    isClosed: closed,
  };
}

export const createFiscalYear = async (fiscalYearData: any) => {
  try {
    const response = await api.post(API_URL, fiscalYearData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getFiscalYears = async () => {
  try {
    const response = await api.get(API_URL);
    return (response.data || []).map((fy: Record<string, unknown>) => normalizeFiscalYear(fy));
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const getFiscalYear = async (id: string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const updateFiscalYear = async (id: string, fiscalYearData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, fiscalYearData);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const deleteFiscalYear = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
 
};

export const runFiscalYearRollover = async (asOfDate?: string) => {
  try {
    const response = await api.post(`${API_URL}/rollover`, asOfDate ? { asOfDate } : {});
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};

export const runFiscalYearRolloverForId = async (id: string | number, force = false) => {
  try {
    const response = await api.post(`${API_URL}/${id}/rollover`, { force });
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error);
    throw error;
  }
};


