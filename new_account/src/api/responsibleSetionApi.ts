import { z } from "zod";
import api from "./apiClient";

export const sectionSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  sectionCode: z.string(),
  responsibleId: z.string()
});

export type Section = z.infer<typeof sectionSchema>;

export async function fetchResponsibleSectionData() {
    const res = await api.get("/responsible-section");
    return res.data;
}
