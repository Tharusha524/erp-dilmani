import api from "../apiClient";

const API_BASE_URL = "/refs";

export interface Ref {
  id?: number | null;
  type: number;
  reference: string;
}

export const getRefs = async () => {
  const response = await api.get(API_BASE_URL);
  return response.data;
};

export const getRefById = async (id: number | string) => {
  const response = await api.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createRef = async (data: Ref) => {
  const response = await api.post(API_BASE_URL, data);
  return response.data;
};

export const updateRef = async (id: number | string, data: Ref) => {
  const response = await api.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteRef = async (id: number | string) => {
  const response = await api.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};


