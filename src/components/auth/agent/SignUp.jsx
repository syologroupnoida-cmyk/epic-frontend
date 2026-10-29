import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import EmailOtpModal from "@/components/auth/EmailOtpModal";
import PasswordToggle from "@/components/auth/PasswordToggle";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import {
  getApiErrorMessage,
  registerAccount,
  resendEmailOtp,
  verifyEmailOtp,
} from "@/util/authApi";
import {
  toRegisterPayload,
  validateRegistrationForm,
} from "@/util/authValidation";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const captcha = {
  left: 6,
  right: 3,
};

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AgentSignUp() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [apiFeedback, setApiFeedback] = useState(null);

  async function showSuccessFeedback(title, text) {
    setApiFeedback({ status: "success", title, text });
    await wait(850);
    setApiFeedback(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function sendOtp(email) {
    setIsResending(true);
    setOtpError("");
    setOtpMessage("");
    setApiFeedback({
      status: "loading",
      title: "Sending OTP",
      text: "Please wait while we send your email verification code.",
    });

    try {
      await resendEmailOtp(email);
      await showSuccessFeedback("OTP Sent", "Check your email for the 6 digit code.");
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not send OTP. Please try again.");
      setApiFeedback({
        status: "error",
        title: "OTP Failed",
        text: message,
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
      return false;
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateRegistrationForm(form);
    if (Number(captchaAnswer.trim()) !== captcha.left + captcha.right) {
      nextErrors.captcha = "Enter the correct captcha answer";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = toRegisterPayload(form, "VENDOR");
    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Creating Account",
      text: "Please wait while we register your vendor account.",
    });

    try {
      const response = await registerAccount(payload);
      await showSuccessFeedback(
        "Account Created",
        response?.data?.message || "Please enter the OTP sent to your email.",
      );
      setRegisteredEmail(payload.email);
      setIsOtpOpen(true);
    } catch (error) {
      setApiFeedback({
        status: "error",
        title: "Registration Failed",
        text: getApiErrorMessage(error, "Registration failed. Please try again."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
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
      text: "Please wait while we verify your email.",
    });

    try {
      await verifyEmailOtp({ email: registeredEmail, otp });
      setForm(initialForm);
      setCaptchaAnswer("");
      setApiFeedback({
        status: "success",
        title: "Email Verified",
        text: "Your email has been verified successfully.",
      });
      await wait(950);
      setApiFeedback(null);
      setIsOtpOpen(false);
      router.push("/partner/login");
    } catch (error) {
      setApiFeedback({
        status: "error",
        title: "OTP Verification Failed",
        text: getApiErrorMessage(error, "OTP verification failed."),
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="epic-login-page epic-register-page epic-vendor-page">
      <section className="epic-login-hero" aria-label="Wedding vendor workspace">
        <Image
          src="/images/auth-vendor-hero.png"
          alt=""
          aria-hidden="true"
          className="epic-login-hero-image"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 50vw"
        />
        <div className="epic-login-hero-overlay" />
        <Link href="/" className="epic-login-brand epic-register-brand" aria-label="Go to home page">
          <Image src="/images/epic-logo-new.png" alt="Epic Wed Planner" width={150} height={72} priority />
        </Link>
        <div className="epic-login-hero-copy epic-register-hero-copy">
          <h1>
            Join our vendor
            <span>network.</span>
          </h1>
          <p>Showcase your services, respond faster, and grow with better wedding leads.</p>
        </div>
      </section>

      <section className="epic-login-form-shell epic-register-form-shell">
        <form onSubmit={handleSubmit} className="epic-login-form epic-register-form">
          <div className="epic-login-heading">
            <h2>Create vendor account</h2>
            <p>Start managing leads and packages with Epic.</p>
          </div>

          <div className="epic-login-divider">
            <span>sign up with email</span>
          </div>

          <div className="epic-register-fields">
            <label className="epic-login-field">
              <span>First name</span>
              <span className="epic-login-input-wrap">
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter your first name" autoComplete="given-name" />
              </span>
              {errors.firstName ? <small>{errors.firstName}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Last name</span>
              <span className="epic-login-input-wrap">
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter your last name" autoComplete="family-name" />
              </span>
              {errors.lastName ? <small>{errors.lastName}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Email address</span>
              <span className="epic-login-input-wrap">
                <input name="email" value={form.email} onChange={handleChange} placeholder="you@business.com" autoComplete="email" />
              </span>
              {errors.email ? <small>{errors.email}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Phone number</span>
              <span className="epic-login-input-wrap">
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" autoComplete="tel" />
              </span>
              {errors.phone ? <small>{errors.phone}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Password</span>
              <span className="epic-login-input-wrap">
                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Create a password" autoComplete="new-password" />
                <PasswordToggle isVisible={showPassword} label="Toggle password visibility" onClick={() => setShowPassword((show) => !show)} />
              </span>
              {errors.password ? <small>{errors.password}</small> : null}
            </label>
            <label className="epic-login-field">
              <span>Confirm password</span>
              <span className="epic-login-input-wrap">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" autoComplete="new-password" />
                <PasswordToggle isVisible={showConfirmPassword} label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword((show) => !show)} />
              </span>
              {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
            </label>
            <label className="epic-login-field epic-captcha-field">
              <span>Captcha: {captcha.left} + {captcha.right}</span>
              <span className="epic-login-input-wrap">
                <input
                  value={captchaAnswer}
                  onChange={(event) => {
                    setCaptchaAnswer(event.target.value);
                    setErrors((current) => ({ ...current, captcha: "" }));
                  }}
                  placeholder="Enter answer"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </span>
              {errors.captcha ? <small>{errors.captcha}</small> : null}
            </label>
          </div>

          <button type="submit" disabled={isSubmitting || isResending} className="epic-signin-button">
            {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Creating account..." : "Create vendor account"}
            <span className="epic-button-arrow" aria-hidden="true" />
          </button>

          <p className="epic-login-create">
            Already a vendor? <Link href="/partner/login">Sign in</Link>
          </p>
        </form>
      </section>
      {isOtpOpen ? (
        <EmailOtpModal
          key={registeredEmail}
          email={registeredEmail}
          isOpen={isOtpOpen}
          isResending={isResending}
          isVerifying={isVerifying}
          message={otpMessage}
          error={otpError}
          onClose={() => setIsOtpOpen(false)}
          onResend={() => sendOtp(registeredEmail)}
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
