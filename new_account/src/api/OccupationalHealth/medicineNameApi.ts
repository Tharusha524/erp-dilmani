import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  medicineName: z.string(),
  genaricName: z.string(),
  dossageStrength: z.string(),
  form: z.string(),
  medicineType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchMedicineList() {
  const res = await api.get("/medicine-name");
  return res.data;
}
