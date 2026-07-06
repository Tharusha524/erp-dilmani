import { z } from "zod";
import api from "../apiClient";

export const categorySchema = z.object({
  id: z.string(),
  categoryName: z.string(),
  subCategory: z.string(),
  observationType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchSubCategory(categoryName) {
  const res = await api.get(`/categories/${categoryName}/subcategories`);
  return res.data;
}

export async function fetchObservationType(categoryName) {
  const res = await api.get(`/subcategories/${categoryName}/observations`);
  return res.data;
}

export async function fetchMainCategory() {
  const res = await api.get("/categories");
  return res.data;
}
