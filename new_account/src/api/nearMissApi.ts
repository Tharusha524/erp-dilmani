import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  type: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchNearMiss() {
  const res = await api.get("/incident-types-nearMiss");
  return res.data;
}
