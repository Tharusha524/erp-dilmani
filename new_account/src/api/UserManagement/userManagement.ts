import api from "../apiClient";

const API_URL = "/user-managements";

export const createUser = async (userData: any) => {
  try {
    const response = await api.post(API_URL, userData);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getUser = async (id: string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateUser = async (id: string | number, userData: any) => {
  try {
    // Handle FormData for file uploads
    if (userData instanceof FormData) {
      userData.append("_method", "PUT"); // Laravel treats this as PUT
      const response = await api.post(`${API_URL}/${id}`, userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    // Regular JSON update
    const response = await api.put(`${API_URL}/${id}`, userData);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateUserProfileImage = async ({
  id,
  imageFile,
}: {
  id: number;
  imageFile: File;
}) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("_method", "PUT");

  const response = await api.post(`${API_URL}/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteUser = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

