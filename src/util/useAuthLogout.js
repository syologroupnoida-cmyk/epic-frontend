import { useRouter } from "next/router";
import { useState } from "react";
import { getApiErrorMessage, logoutAccount } from "@/util/authApi";
import { clearAuthSession, getRefreshToken } from "@/util/authSession";

export default function useAuthLogout(redirectTo) {
  const router = useRouter();
  const [logoutFeedback, setLogoutFeedback] = useState(null);

  async function handleLogout() {
    const refreshToken = getRefreshToken();

    setLogoutFeedback({
      status: "loading",
      title: "Logout...",
      text: "Please wait while we end your session.",
    });

    try {
      if (refreshToken) {
        await logoutAccount(refreshToken);
      }
      clearAuthSession();
      setLogoutFeedback({
        status: "loading",
        title: "Logout...",
        text: "Your session has been closed successfully.",
      });
      await router.push(redirectTo);
    } catch (error) {
      setLogoutFeedback({
        status: "error",
        title: "Logout Failed",
        text: getApiErrorMessage(error, "Logout failed. Please try again."),
        okLabel: "OK",
        onOk: () => setLogoutFeedback(null),
      });
    }
  }

  return { handleLogout, logoutFeedback };
}
