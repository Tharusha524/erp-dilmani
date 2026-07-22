import { z } from "zod";
import api from "./apiClient";

export const departmentSchema = z.object({
  id: z.string(),
  department: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type departmentSchema = z.infer<typeof departmentSchema>;

export async function fetchDepartmentData() {
  const res = await api.get("/departments");
  return res.data;
}

export async function getDepartment(id: string | number) {
  const res = await api.get(`/departments/${id}`);
  return res.data;
}

export async function createDepartment(data: {
  department: string;
  description?: string;
  inactive?: boolean;
}) {
  const res = await api.post("/departments", data);
  return res.data;
}

export async function updateDepartment(
  id: string | number,
  data: { department: string; description?: string; inactive?: boolean }
) {
  const res = await api.put(`/departments/${id}`, data);
  return res.data;
}

export async function deleteDepartment(id: string | number) {
  const res = await api.delete(`/departments/${id}`);
  return res.data;
}

