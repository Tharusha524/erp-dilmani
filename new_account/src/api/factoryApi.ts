import { z } from "zod";
import api from "./apiClient";

export const factorySchema = z.object({
  id: z.string(),
  factoryName: z.string(),
});

export type factorySchema = z.infer<typeof factorySchema>;

export async function fetchFactoryData() {
    const res = await api.get("/factory");
    return res.data;
}
