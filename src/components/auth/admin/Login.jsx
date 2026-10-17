import Link from "next/link";
import Image from "next/image";
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

export default function AdminLogin() {
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
      text: "Please wait while we verify your admin access.",
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
        text: response?.data?.message || "Admin login successful.",
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
    <div className="epic-login-page epic-admin-page">
      <section className="epic-login-hero" aria-label="Admin workspace">
        <Image
          src="/images/auth-admin-login-bg.png"
          alt=""
          aria-hidden="true"
          className="epic-login-hero-image"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 50vw"
        />
        <div className="epic-login-hero-overlay epic-admin-hero-overlay" />
        <Link href="/" className="epic-login-brand" aria-label="Go to home page">
          <Image src="/images/epic-logo-new.png" alt="Epic Wed Planner" width={150} height={72} priority />
        </Link>
        <div className="epic-login-hero-copy">
          <h1>
            Command the
            <span>platform.</span>
          </h1>
          <p>Review users, vendors, services, and approvals from a focused admin desk.</p>
        </div>
      </section>

      <section className="epic-login-form-shell epic-admin-form-shell">
        <form onSubmit={handleSubmit} className="epic-login-form epic-admin-form">
          <div className="epic-login-heading">
            <h2>Admin login</h2>
            <p>Secure access for platform operations.</p>
          </div>

          <div className="epic-login-divider">
            <span>authorized access only</span>
          </div>

          <div className="epic-login-fields">
            <label className="epic-login-field">
              <span>Email address</span>
              <span className="epic-login-input-wrap">
                <input name="email" value={form.email} onChange={handleChange} placeholder="admin@epic.com" autoComplete="email" />
              </span>
              {errors.email ? <small>{errors.email}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Password</span>
              <span className="epic-login-input-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <PasswordToggle
                  isVisible={showPassword}
                  label="Toggle password visibility"
                  onClick={() => setShowPassword((show) => !show)}
                />
              </span>
              {errors.password ? <small>{errors.password}</small> : null}
            </label>
          </div>

          <div className="epic-login-options">
            <span />
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isSubmitting} className="epic-signin-button">
            {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Please wait..." : "Sign in"}
            <span className="epic-button-arrow" aria-hidden="true" />
          </button>
        </form>
      </section>
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
