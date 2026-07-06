import api from "../apiClient";

export const login = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/login", data, {
      skipErrorDialog: true,
    } as Record<string, unknown>);
    const token = response.data.access_token || response.data.token;

    if (token) {
      localStorage.setItem("token", token);
    }

    return { ...response.data, access_token: token };
  } catch (error: unknown) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/logout", {}, {
      skipErrorDialog: true,
    } as Record<string, unknown>);
    localStorage.removeItem("token");
    return response.data;
  } catch (error: unknown) {
    localStorage.removeItem("token");
    console.error("Logout failed:", error);
    throw error;
  }
};
