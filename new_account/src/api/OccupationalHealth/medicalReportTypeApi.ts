import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllMedicalReportType() {
  const res = await api.get("/medical-documents-types");
  return res.data;
}
