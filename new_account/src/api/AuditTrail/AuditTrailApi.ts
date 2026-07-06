// src/api/AuditTrail/auditTrailApi.ts
import api from "../apiClient";

const BASE_URL = "/audit-trails";

const auditTrailApi = {

  getAll: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  getById: async (id: number | string) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number | string, data: any) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

};

export default auditTrailApi;


