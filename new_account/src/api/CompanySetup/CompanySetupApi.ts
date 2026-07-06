import api from "../apiClient";

const API_URL = "/company-setup";

export const createCompany = async (companyData: FormData) => {
  const response = await api.post(API_URL, companyData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getCompanies = async () => {
  const response = await api.get(API_URL, { skipErrorDialog: true } as Parameters<
    typeof api.get
  >[1]);
  return response.data;
};

export const getCompany = async (id: string | number) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateCompany = async (id: string | number, companyData: FormData) => {
  companyData.append("_method", "PUT");
  const response = await api.post(`${API_URL}/${id}`, companyData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCompany = async (id: string | number) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

/** Fetch company logo as blob (authenticated; reliable for print preview). */
export const fetchCompanyLogoBlob = async (): Promise<Blob> => {
  const response = await api.get(`${API_URL}/logo`, {
    responseType: "blob",
    skipErrorDialog: true,
  } as Parameters<typeof api.get>[1]);
  return response.data;
};

