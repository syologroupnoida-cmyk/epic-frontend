import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl.mjs";
import {
  clearAuthSession,
  extractAuthPayload,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/util/authSession";

const MainApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

let refreshRequest;

function refreshSession(refreshToken) {
  if (!refreshRequest) {
    refreshRequest = axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 20000 }).then((response) => {
      const tokens = extractAuthPayload(response.data);
      if (!tokens.accessToken) throw new Error("Refresh response did not include an access token.");
      setAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken || refreshToken });
      return tokens.accessToken;
    }).finally(() => { refreshRequest = undefined; });
  }
  return refreshRequest;
}

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
    const isAuthRequest = /\/auth\/(?:login|register|google\/login|refresh)(?:[/?]|$)/.test(originalRequest?.url || "");

    if (status !== 401 || !originalRequest || originalRequest._retry || !refreshToken || isAuthRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshSession(refreshToken);

      if (typeof originalRequest.headers?.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
      } else {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${accessToken}`,
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
