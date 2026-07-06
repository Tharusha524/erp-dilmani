import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  documentType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllDocumentType() {
  const res = await api.get("/documents-types");
  return res.data;
}
