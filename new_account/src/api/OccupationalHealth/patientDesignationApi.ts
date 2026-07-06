import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  designationName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchDesignation() {
  const res = await api.get("/designations");
  return res.data;
}

