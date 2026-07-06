import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  doctorName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllDoctors() {
  const res = await api.get("/consulting-doctors");
  return res.data;
}
