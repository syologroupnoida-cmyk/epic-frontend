import { useRouter } from "next/router";
import { useState } from "react";
import AdminLoginView from "@/components/auth/AdminLoginView";
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

  return <AdminLoginView
    superAdmin
    form={form}
    errors={errors}
    showPassword={showPassword}
    isSubmitting={isSubmitting}
    apiFeedback={apiFeedback}
    onChange={handleChange}
    onSubmit={handleSubmit}
    onTogglePassword={() => setShowPassword((show) => !show)}
  />;
}
