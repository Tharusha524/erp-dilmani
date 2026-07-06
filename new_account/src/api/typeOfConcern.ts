import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  typeConcerns: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchTypeOfConcerns() {
  const res = await api.get("/incident-types-concern");
  return res.data;
}
