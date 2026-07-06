import api from "../apiClient";

const API_URL = "/stock-moves";

//  Get all
export const getStockMoves = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

//  Get by ID
export const getStockMoveById = async (id: number) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

//  Create new
export const createStockMove = async (data: any) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

//  Update
export const updateStockMove = async (id: number, data: any) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

//  Delete
export const deleteStockMove = async (id: number) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};


