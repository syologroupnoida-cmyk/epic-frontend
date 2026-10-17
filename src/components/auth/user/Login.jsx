import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import PasswordToggle from "@/components/auth/PasswordToggle";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import { getApiErrorMessage, googleLogin, loginAccount } from "@/util/authApi";
import { getPostLoginAction } from "@/util/authRedirect";
import {
  extractAuthPayload,
  setAuthTokens,
  setAuthUser,
} from "@/util/authSession";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getResponseMessage(response, fallback) {
  return response?.data?.message || response?.data?.data?.message || fallback;
}

export default function UserLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  async function completeLogin(response, fallbackMessage) {
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
      text: getResponseMessage(response, fallbackMessage),
    });
    await router.push(action.route);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Logging...",
      text: "Please wait while we verify your credentials.",
    });

    try {
      const response = await loginAccount({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      await completeLogin(response, "You are logged in successfully.");
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

  async function handleGoogleLogin() {
    const googleIdToken = window.prompt("Enter Google ID token");
    if (!googleIdToken) return;

    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Logging...",
      text: "Please wait while we verify your Google account.",
    });

    try {
      const response = await googleLogin({ token: googleIdToken, role: "CLIENT" });
      await completeLogin(response, "Google login successful.");
    } catch (error) {
      setApiFeedback({
        status: "error",
        title: "Google Login Failed",
        text: getApiErrorMessage(error, "Google login failed. Please try again."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="epic-login-page">
      <section className="epic-login-hero" aria-label="Luxury wedding venue">
        <Image
          src="/images/auth-wedding-login-hero.png"
          alt=""
          aria-hidden="true"
          className="epic-login-hero-image"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 50vw"
        />
        <div className="epic-login-hero-overlay" />
        <Link href="/" className="epic-login-brand" aria-label="Go to home page">
          <Image
            src="/images/epic-logo-new.png"
            alt="Epic Wed Planner"
            width={150}
            height={72}
            priority
          />
        </Link>
        <div className="epic-login-hero-copy">
          <h1>
            Your <em>forever</em>
            <span>starts here.</span>
          </h1>
          <p>Plan beautiful moments, effortlessly.</p>
        </div>
      </section>

      <section className="epic-login-form-shell">
        <form onSubmit={handleSubmit} className="epic-login-form">
          <div className="epic-login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to continue your wedding journey</p>
          </div>

          <div className="epic-login-divider">
            <span>or sign in with email</span>
          </div>

          <div className="epic-login-fields">
            <label className="epic-login-field">
              <span>Email address</span>
              <span className="epic-login-input-wrap">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@yourmail.com"
                  autoComplete="email"
                />
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
            <label className="epic-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span aria-hidden="true" />
              Remember me
            </label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="epic-google-button"
          >
            {isSubmitting ? <span className="button-spinner button-spinner-dark" aria-hidden="true" /> : null}
            <span className="epic-google-mark" aria-hidden="true">
              G
            </span>
            Continue with Google
          </button>

          <button type="submit" disabled={isSubmitting} className="epic-signin-button">
            {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Please wait..." : "Sign in"}
            <span className="epic-button-arrow" aria-hidden="true" />
          </button>

          <p className="epic-login-create">
            New to Epic? <Link href="/user/sign-up">Create an account</Link>
          </p>

          <p className="epic-login-terms">
            By continuing, you agree to our <Link href="/">Terms of Service</Link> and{" "}
            <Link href="/">Privacy Policy</Link>.
          </p>
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
