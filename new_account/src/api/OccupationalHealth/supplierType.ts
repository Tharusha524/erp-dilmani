import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  type: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllSupplierTypes() {
  const res = await api.get("/supplier-type");
  return res.data;
}
