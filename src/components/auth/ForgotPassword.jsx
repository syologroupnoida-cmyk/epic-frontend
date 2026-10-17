import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import EmailOtpModal from "@/components/auth/EmailOtpModal";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import {
  forgotPassword,
  getApiErrorMessage,
  verifyPasswordResetOtp,
} from "@/util/authApi";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getResetToken(response) {
  return (
    response?.data?.resetToken ||
    response?.data?.data?.resetToken ||
    response?.data?.token ||
    response?.data?.data?.token ||
    ""
  );
}

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [apiFeedback, setApiFeedback] = useState(null);

  async function showSuccessFeedback(title, text) {
    setApiFeedback({ status: "success", title, text });
    await wait(850);
    setApiFeedback(null);
  }

  async function sendResetOtp(targetEmail, isResend = false) {
    setOtpError("");
    setOtpMessage("");
    if (isResend) {
      setIsResending(true);
    } else {
      setIsSubmitting(true);
    }

    setApiFeedback({
      status: "loading",
      title: isResend ? "Resending OTP" : "Sending OTP",
      text: "Please wait while we send your password reset code.",
    });

    try {
      const response = await forgotPassword(targetEmail);
      setResetEmail(targetEmail);
      setIsOtpOpen(true);
      setOtpMessage("");
      await showSuccessFeedback("OTP Sent", response?.data?.message || "Check your email for the 6 digit reset code.");
      return true;
    } catch (apiError) {
      const message = getApiErrorMessage(apiError, "Could not send OTP. Please try again.");
      setApiFeedback({
        status: "error",
        title: isResend ? "Resend Failed" : "OTP Failed",
        text: message,
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
      return false;
    } finally {
      setIsSubmitting(false);
      setIsResending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid registered email address");
      return;
    }

    await sendResetOtp(normalizedEmail);
  }

  async function handleVerifyOtp(otp) {
    setOtpError("");
    setOtpMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter a valid 6 digit OTP.");
      return;
    }

    setIsVerifying(true);
    setApiFeedback({
      status: "loading",
      title: "Verifying OTP",
      text: "Please wait while we verify your reset code.",
    });

    try {
      const response = await verifyPasswordResetOtp({ email: resetEmail, otp });
      const resetToken = getResetToken(response);

      if (!resetToken) {
        throw new Error("Reset token missing from API response.");
      }

      window.sessionStorage.setItem("epic_password_reset_token", resetToken);
      window.sessionStorage.setItem("epic_password_reset_email", resetEmail);
      setApiFeedback({
        status: "success",
        title: "OTP Verified",
        text: response?.data?.message || "You can now create a new password.",
      });
      await wait(850);
      setApiFeedback(null);
      setIsOtpOpen(false);
      router.push("/reset-password");
    } catch (apiError) {
      setApiFeedback({
        status: "error",
        title: "OTP Verification Failed",
        text: getApiErrorMessage(apiError, "OTP verification failed."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="auth-main auth-user-split auth-split-page min-h-screen px-4 py-10 text-stone-900">
      <div className="auth-split-card">
        <aside className="auth-visual-panel">
          <div className="auth-visual-copy">
            <p>Password Help</p>
            <h1>Recover access to your account</h1>
            <span>Enter your registered email and we will send a password reset OTP.</span>
          </div>
        </aside>
        <div className="auth-form-panel">
          <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
            <h2 className="font-serif text-3xl font-bold">Forgot Password</h2>
            <div className="mt-6 grid gap-4">
              <label className="mui-field">
                <input name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder=" " />
                <span>Registered email</span>
                {error ? <small>{error}</small> : null}
              </label>
              <button
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
              <p className="text-sm text-stone-600">
                Already verified OTP?{" "}
                <Link href="/reset-password" className="font-bold text-[#b61f4b]">
                  Create new password
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      {isOtpOpen ? (
        <EmailOtpModal
          key={resetEmail}
          email={resetEmail}
          isOpen={isOtpOpen}
          isResending={isResending}
          isVerifying={isVerifying}
          eyebrow="Password Reset"
          heading="Enter OTP"
          description="We sent a password reset code to"
          verifyLabel="Verify OTP"
          message={otpMessage}
          error={otpError}
          onClose={() => setIsOtpOpen(false)}
          onResend={() => sendResetOtp(resetEmail, true)}
          onVerify={handleVerifyOtp}
        />
      ) : null}
      <ApiStatusModal
        status={apiFeedback?.status}
        title={apiFeedback?.title}
        text={apiFeedback?.text}
        okLabel={apiFeedback?.okLabel}
        onOk={apiFeedback?.onOk}
      />
    </div>
  );
}
