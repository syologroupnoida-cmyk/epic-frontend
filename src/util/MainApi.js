import axios from "axios";
import {
  clearAuthSession,
  extractAuthPayload,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/util/authSession";

const API_BASE_URL = "https://api.wedplanners.in/api/v1";

const MainApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

MainApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }

  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return config;
});

MainApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const refreshToken = getRefreshToken();
    const isAuthRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (status !== 401 || originalRequest?._retry || !refreshToken || isAuthRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const tokens = extractAuthPayload(refreshResponse.data);
      setAuthTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || refreshToken,
      });

      if (!tokens.accessToken) {
        throw new Error("Refresh response did not include an access token.");
      }

      if (typeof originalRequest.headers?.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      } else {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${tokens.accessToken}`,
        };
      }
      return MainApi(originalRequest);
    } catch (refreshError) {
      clearAuthSession();
      return Promise.reject(refreshError);
    }
  },
);

export default MainApi;
