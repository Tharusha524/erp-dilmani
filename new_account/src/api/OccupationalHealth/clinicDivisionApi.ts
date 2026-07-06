import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  benefitType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllBenefitList() {
  const res = await api.get("/benefit-types");
  return res.data;
}
