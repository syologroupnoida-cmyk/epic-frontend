import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import PasswordToggle from "@/components/auth/PasswordToggle";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import { getApiErrorMessage, loginAccount } from "@/util/authApi";
import { getPostLoginAction } from "@/util/authRedirect";
import {
  extractAuthPayload,
  setAuthTokens,
  setAuthUser,
} from "@/util/authSession";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SuperAdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiFeedback, setApiFeedback] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Logging...",
      text: "Please wait while we verify your super-admin access.",
    });

    try {
      const response = await loginAccount({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const authPayload = extractAuthPayload(response.data);
      const action = getPostLoginAction(authPayload.user);

      setAuthTokens({ ...authPayload, role: action.role });
      setAuthUser(authPayload.user);

      if (action.type === "pending-approval") {
        setApiFeedback({
          status: "success",
          title: "KYC is submitted",
          text: "KYC approval is pending from Admin side.",
          okLabel: "OK",
          onOk: () => setApiFeedback(null),
        });
        return;
      }

      setApiFeedback({
        status: "loading",
        title: "Logging...",
        text: response?.data?.message || "Super-admin login successful.",
      });
      await router.push(action.route);
    } catch (error) {
      setApiFeedback({
        status: "error",
        title: "Login Failed",
        text: getApiErrorMessage(error, "Login failed. Please try again."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-main auth-admin-split auth-split-page min-h-screen px-4 py-10 text-stone-900">
      <div className="auth-split-card">
        <aside className="auth-visual-panel">
          <div className="auth-visual-copy">
            <p>Super Admin Access</p>
            <h1>Control the platform securely</h1>
            <span>Manage high-level platform operations with secure account access.</span>
          </div>
        </aside>
        <div className="auth-form-panel">
          <form
            onSubmit={handleSubmit}
            className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8"
          >
            <h2 className="font-serif text-3xl font-bold">Super Admin Login</h2>
            <div className="mt-6 grid gap-4">
              <label className="mui-field">
                <input name="email" value={form.email} onChange={handleChange} placeholder=" " />
                <span>Email address</span>
                {errors.email ? <small>{errors.email}</small> : null}
              </label>
              <label className="mui-field password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder=" "
                />
                <span>Password</span>
                <PasswordToggle
                  isVisible={showPassword}
                  label="Toggle password visibility"
                  onClick={() => setShowPassword((show) => !show)}
                />
                {errors.password ? <small>{errors.password}</small> : null}
              </label>
              <Link href="/forgot-password" className="auth-forgot-link">
                Forgot Password?
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
                {isSubmitting ? "Please wait..." : "Login"}
              </button>
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
