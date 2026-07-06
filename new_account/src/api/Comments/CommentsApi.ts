import api from "../apiClient";

const API_URL = "/comments";

/**
 * Get all comments
 */
export const getComments = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

/**
 * Create a new comment
 * @param data - Object containing comment details
 */
export const createComment = async (data: any) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating comment:", error.response?.data || error);
    throw error;
  }
};


