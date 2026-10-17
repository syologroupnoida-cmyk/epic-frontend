import MainApi from "@/util/MainApi";

export function registerAccount(payload) {
  return MainApi.post("/auth/register", payload);
}

export function loginAccount(payload) {
  return MainApi.post("/auth/login", payload);
}

export function googleLogin({ token, role = "CLIENT" }) {
  return MainApi.post("/auth/google/login", { token, role });
}

export function refreshAuthToken(refreshToken) {
  return MainApi.post("/auth/refresh", { refreshToken });
}

export function logoutAccount(refreshToken) {
  return MainApi.post("/auth/logout", { refreshToken });
}

export function resendEmailOtp(email) {
  return MainApi.post("/auth/resend-otp", { email });
}

export function verifyEmailOtp({ email, otp }) {
  return MainApi.post("/auth/verify-email", { email, otp });
}

export function forgotPassword(email) {
  return MainApi.post("/auth/password/forgot", { email });
}

export function verifyPasswordResetOtp({ email, otp }) {
  return MainApi.post("/auth/password/verify-otp", { email, otp });
}

export function resetPassword({ resetToken, newPassword }) {
  return MainApi.post("/auth/password/reset", { resetToken, newPassword });
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if ([502, 503, 504].includes(error?.response?.status)) {
    return `The API server is temporarily unavailable (HTTP ${error.response.status}). Please try again shortly.`;
  }
  const data = error?.response?.data || {};
  const firstValidationMessage = Array.isArray(data.errors)
    ? data.errors.find((item) => item?.message)?.message
    : "";
  const objectErrorMessage =
    data.error && typeof data.error === "object"
      ? data.error.message
      : "";

  return (
    firstValidationMessage ||
    data.message ||
    objectErrorMessage ||
    (typeof data.error === "string" ? data.error : "") ||
    error?.message ||
    fallback
  );
}
