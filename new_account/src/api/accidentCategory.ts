import { z } from "zod";
import api from "./apiClient";

export const categorySchema = z.object({
  id: z.string(),
  categoryName: z.string(),
  subCategoryName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchAccidentSubCategory(categoryName) {
  const res = await api.get(`/accident-categories/${categoryName}/subcategories`);
  return res.data;
}

export async function fetchMainAccidentCategory() {
  const res = await api.get("/accident-categories");
  return res.data;
}
