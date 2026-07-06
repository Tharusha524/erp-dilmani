import { z } from "zod";
import api from "./apiClient";

export const jobPositionSchema = z.object({
  id: z.string(),
  jobPosition: z.string(),
});

export type jobPositionSchema = z.infer<typeof jobPositionSchema>;

export async function fetchJobPositionData() {
    const res = await api.get("/job-positions");
    return res.data;
}
