import api from "./apiClient";
import { UserRole } from "./userApi";

export const getAccessRolesList = async () => {
  const res = await api.get(`/user-permissions`);
  return res.data;
};

export const createAccessRole = async (role: UserRole) => {
  const res = await api.post(`/user-permissions`, role);
  return res.data;
};

export const updateAccessRole = async (role: UserRole) => {
  const res = await api.post(`/user-permissions/${role.id}/update`, role);
  return res.data;
};

export const deleteAccessRole = async (roleId: number) => {
  const res = await api.delete(`/user-permissions/${roleId}/delete`);
  return res.data;
};

