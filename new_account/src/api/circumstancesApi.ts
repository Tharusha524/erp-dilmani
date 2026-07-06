import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllCircumstances() {
  const res = await api.get("/incident-circumstances");
  return res.data;
}
