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

