import api from "../apiClient";

const API_URL = "/login-slideshow-images";

export interface LoginSlideshowImage {
  id: number;
  path: string;
  url: string;
  sort_order: number;
}

export const getLoginSlideshowImages = async (): Promise<LoginSlideshowImage[]> => {
  const response = await api.get(API_URL, { skipErrorDialog: true } as any);
  return response.data;
};

export const uploadLoginSlideshowImage = async (file: File): Promise<LoginSlideshowImage> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteLoginSlideshowImage = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};

export const reorderLoginSlideshowImages = async (
  order: number[]
): Promise<LoginSlideshowImage[]> => {
  const response = await api.post(`${API_URL}/reorder`, { order });
  return response.data;
};
