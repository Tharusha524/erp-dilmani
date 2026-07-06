import api from "../apiClient";

export interface LoginIpSettings {
  loginIpRestrictionEnabled: boolean;
  loginIpAllowLocalhost: boolean;
  loginAllowedIps: string;
  detectedIp?: string;
}

export const getLoginIpSettings = async (): Promise<LoginIpSettings> => {
  const { data } = await api.get("/login-ip-settings");
  return data;
};

export const updateLoginIpSettings = async (
  payload: Partial<LoginIpSettings>
): Promise<{ message: string; settings: LoginIpSettings }> => {
  const { data } = await api.put("/login-ip-settings", payload);
  return data;
};
