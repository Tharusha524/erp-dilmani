import api from "../apiClient";

export interface AppLanguage {
  id: number;
  code: string;
  name: string;
  version?: string;
  installed: boolean;
}

export interface AppTheme {
  id: number;
  theme_key: string;
  name: string;
  version?: string;
  installed: boolean;
}

export interface AppExtension {
  id: number;
  extension_key: string;
  name: string;
  version?: string;
  installed: boolean;
}

export const getAppLanguages = async () => {
  const { data } = await api.get("/app-languages");
  return data as AppLanguage[];
};

export const createAppLanguage = async (payload: Partial<AppLanguage>) => {
  const { data } = await api.post("/app-languages", payload);
  return data;
};

export const updateAppLanguage = async (id: number, payload: Partial<AppLanguage>) => {
  const { data } = await api.put(`/app-languages/${id}`, payload);
  return data;
};

export const deleteAppLanguage = async (id: number) => {
  await api.delete(`/app-languages/${id}`);
};

export const getAppThemes = async () => {
  const { data } = await api.get("/app-themes");
  return data as AppTheme[];
};

export const createAppTheme = async (payload: Partial<AppTheme>) => {
  const { data } = await api.post("/app-themes", payload);
  return data;
};

export const updateAppTheme = async (id: number, payload: Partial<AppTheme>) => {
  const { data } = await api.put(`/app-themes/${id}`, payload);
  return data;
};

export const deleteAppTheme = async (id: number) => {
  await api.delete(`/app-themes/${id}`);
};

export const getAppExtensions = async () => {
  const { data } = await api.get("/app-extensions");
  return data as AppExtension[];
};

export const createAppExtension = async (payload: Partial<AppExtension>) => {
  const { data } = await api.post("/app-extensions", payload);
  return data;
};

export const updateAppExtension = async (id: number, payload: Partial<AppExtension>) => {
  const { data } = await api.put(`/app-extensions/${id}`, payload);
  return data;
};

export const deleteAppExtension = async (id: number) => {
  await api.delete(`/app-extensions/${id}`);
};

