import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import PasswordToggle from "@/components/auth/PasswordToggle";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import { getApiErrorMessage, resetPassword } from "@/util/authApi";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function ResetPassword() {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiFeedback, setApiFeedback] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    const resetToken = window.sessionStorage.getItem("epic_password_reset_token") || "";
    if (!resetToken) {
      setApiFeedback({
        status: "error",
        title: "OTP Required",
        text: "Please verify your reset OTP before creating a new password.",
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
      return;
    }
    if (form.password.length < 6) nextErrors.password = "New password must be 6 characters";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Updating Password",
      text: "Please wait while we reset your password.",
    });

    try {
      const response = await resetPassword({
        resetToken,
        newPassword: form.password,
      });
      window.sessionStorage.removeItem("epic_password_reset_token");
      window.sessionStorage.removeItem("epic_password_reset_email");
      setApiFeedback({
        status: "success",
        title: "Password Updated",
        text: response?.data?.message || "Your password has been updated successfully.",
      });
      await wait(850);
      setApiFeedback(null);
      router.push("/user/login");
    } catch (error) {
      setApiFeedback({
        status: "error",
        title: "Reset Failed",
        text: getApiErrorMessage(error, "Password reset failed. Please try again."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-main auth-signup-split auth-split-page min-h-screen px-4 py-10 text-stone-900">
      <div className="auth-split-card">
        <aside className="auth-visual-panel">
          <div className="auth-visual-copy">
            <p>Secure Reset</p>
            <h1>Create a new password</h1>
            <span>Use the link from your email to set a fresh password for your account.</span>
          </div>
        </aside>
        <div className="auth-form-panel">
          <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
            <h2 className="font-serif text-3xl font-bold">Create New Password</h2>
            <div className="mt-6 grid gap-4">
              <label className="mui-field password-field">
                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder=" " />
                <span>New password</span>
                <PasswordToggle isVisible={showPassword} label="Toggle new password visibility" onClick={() => setShowPassword((show) => !show)} />
                {errors.password ? <small>{errors.password}</small> : null}
              </label>
              <label className="mui-field password-field">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder=" " />
                <span>Confirm password</span>
                <PasswordToggle isVisible={showConfirmPassword} label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword((show) => !show)} />
                {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
              </label>
              <button
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
              <p className="text-sm text-stone-600">
                Need a reset code?{" "}
                <Link href="/forgot-password" className="font-bold text-[#b61f4b]">
                  Verify email
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
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
