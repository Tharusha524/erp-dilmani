// apiClient.ts
import axios, { AxiosRequestHeaders, InternalAxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "../config/backendConfig";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessage";
import { notify } from "../services/notificationService";

export { getApiBaseUrl as API_BASE_URL };

export type ApiRequestConfig = Partial<InternalAxiosRequestConfig> & {
  skipErrorDialog?: boolean;
};

const api = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  if (!config.headers) {
    config.headers = {} as AxiosRequestHeaders;
  }

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error("Request Interceptor Error:", error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Response Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    const config = (error?.config ?? error?.response?.config) as ApiRequestConfig | undefined;
    const skipDialog = config?.skipErrorDialog === true;
    const isBlob = config?.responseType === "blob";

    if (!skipDialog && !isBlob) {
      const errorResponse = error?.response ?? error;
      const message = getFriendlyApiErrorMessage(errorResponse);

      if (message.includes("check your connection")) {
        const base = error.config?.baseURL ?? getApiBaseUrl() ?? "";
        const path = error.config?.url ?? "unknown";
        const fullUrl =
          path.startsWith("http")
            ? path
            : `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\//, "")}`;
        const debugInfo = `\n\nTechnical Details:\nURL: ${fullUrl}\nAPI base: ${base || "(not set)"}\nMessage: ${error.message}`;
        notify.errorDialog(message + debugInfo, { title: "Connection problem" });
      } else {
        notify.error(message);
      }
    }

    return Promise.reject(error?.response ?? error);
  }
);

export default api;
