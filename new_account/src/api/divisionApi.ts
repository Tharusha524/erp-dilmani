import { z } from "zod";
import api from "./apiClient";

export const divisionSchema = z.object({
  id: z.string(),
  divisionName: z.string(),
});

export type divisionSchema = z.infer<typeof divisionSchema>;

export async function fetchDivision() {
  const res = await api.get("/hr-divisions");
  return res.data;
}
