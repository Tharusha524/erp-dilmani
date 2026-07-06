import api from "../apiClient";

const API_URL = "/dimension-tags";

export const createTag = async (tagData: { tagName: string; tagDescription?: string }) => {
  const response = await api.post(API_URL, tagData);
  return response.data;
};

export const getTags = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getTag = async (id: string | number) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateTag = async (
  id: string | number,
  tagData: { tagName: string; tagDescription?: string }
) => {
  const response = await api.put(`${API_URL}/${id}`, tagData);
  return response.data;
};

export const deleteTag = async (id: string | number) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

