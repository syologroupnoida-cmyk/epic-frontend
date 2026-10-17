const ACCESS_TOKEN_KEY = "epic_access_token";
const REFRESH_TOKEN_KEY = "epic_refresh_token";
const AUTH_USER_KEY = "epic_auth_user";
const AUTH_ROLE_KEY = "epic_auth_role";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeToken(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return normalizeToken(
      value.accessToken ||
      value.access_token ||
      value.refreshToken ||
      value.refresh_token ||
      value.token ||
      value.jwt ||
      "",
    );
  }

  const rawValue = String(value).trim();

  if ((rawValue.startsWith("{") && rawValue.endsWith("}")) || (rawValue.startsWith('"') && rawValue.endsWith('"'))) {
    try {
      return normalizeToken(JSON.parse(rawValue));
    } catch {
      // Continue with the raw token when stored content is not valid JSON.
    }
  }

  return rawValue.replace(/^Bearer\s+/i, "").trim();
}

function readStorage(key) {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(key) || "";
}

function writeStorage(key, value) {
  if (!isBrowser() || !value) return;
  window.localStorage.setItem(key, value);
}

function removeStorage(key) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

function writeCookie(key, value) {
  if (!isBrowser() || !value) return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
}

function removeCookie(key) {
  if (!isBrowser()) return;
  document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken() {
  return normalizeToken(readStorage(ACCESS_TOKEN_KEY));
}

export function getRefreshToken() {
  return normalizeToken(readStorage(REFRESH_TOKEN_KEY));
}

export function setAuthTokens({ accessToken, refreshToken, role }) {
  const normalizedAccessToken = normalizeToken(accessToken);
  const normalizedRefreshToken = normalizeToken(refreshToken);

  writeStorage(ACCESS_TOKEN_KEY, normalizedAccessToken);
  writeStorage(REFRESH_TOKEN_KEY, normalizedRefreshToken);
  writeCookie(ACCESS_TOKEN_KEY, normalizedAccessToken);
  writeCookie(REFRESH_TOKEN_KEY, normalizedRefreshToken);
  if (role) {
    writeStorage(AUTH_ROLE_KEY, role);
    writeCookie(AUTH_ROLE_KEY, role);
  }
  if (isBrowser()) window.dispatchEvent(new Event("epic-auth-change"));
}

export function setAuthUser(user) {
  if (!isBrowser() || !user) return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("epic-auth-change"));
}

export function getAuthUser() {
  if (!isBrowser()) return null;

  try {
    return JSON.parse(window.localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
  removeStorage(AUTH_USER_KEY);
  removeStorage(AUTH_ROLE_KEY);
  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
  removeCookie(AUTH_ROLE_KEY);
  if (isBrowser()) window.dispatchEvent(new Event("epic-auth-change"));
}

export function extractAuthPayload(responseData = {}) {
  const data = responseData.data || responseData;
  const tokenData = data.tokens || data.authTokens || data.auth || data.session || {};
  const accessToken = normalizeToken(
    data.access_token ||
    data.accessToken ||
    tokenData.access_token ||
    tokenData.accessToken ||
    (typeof data.token === "string" ? data.token : data.token?.accessToken || data.token?.access_token) ||
    data.jwt ||
    "",
  );
  const refreshToken = normalizeToken(
    data.refresh_token ||
    data.refreshToken ||
    tokenData.refresh_token ||
    tokenData.refreshToken ||
    data.refresh ||
    "",
  );
  const user = data.user || data.account || data.profile || null;

  return { accessToken, refreshToken, user };
}
