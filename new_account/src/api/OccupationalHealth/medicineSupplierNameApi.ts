import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllSupplierName() {
  const res = await api.get("/supplier-name");
  return res.data;
}
