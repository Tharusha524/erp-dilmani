import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  factorName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllFactors() {
  const res = await api.get("/incident-factors");
  return res.data;
}
