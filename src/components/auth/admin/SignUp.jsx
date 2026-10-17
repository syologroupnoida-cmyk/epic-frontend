import Link from "next/link";
import { useState } from "react";
import PasswordToggle from "@/components/auth/PasswordToggle";
import ApiStatusModal from "@/components/common/ApiStatusModal";

export default function AdminSignUp() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiFeedback, setApiFeedback] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Valid email is required";
    if (!/^[0-9]{10}$/.test(form.phone)) nextErrors.phone = "Enter 10 digit phone";
    if (form.password.length < 8) nextErrors.password = "Password must be 8 characters";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function dummyAdminSignUpApi(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 450));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiFeedback({
      status: "loading",
      title: "Submitting Request",
      text: "Please wait while we submit your admin access request.",
    });

    try {
      await dummyAdminSignUpApi(form);
      setApiFeedback({
        status: "success",
        title: "Request Submitted",
        text: "Admin access request submitted.",
        okLabel: "OK",
        onOk: () => setApiFeedback(null),
      });
    } catch {
      setApiFeedback({
        status: "error",
        title: "Request Failed",
        text: "Could not submit admin access request. Please try again.",
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
            <p>Access Request</p>
            <h1>Request admin approval</h1>
            <span>Submit your details so the team can verify access for platform management.</span>
          </div>
        </aside>
        <div className="auth-form-panel">
        <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
          <h2 className="font-serif text-3xl font-bold">Admin Sign up</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <label className="mui-field"><input name="firstName" value={form.firstName} onChange={handleChange} placeholder=" " /><span>First name</span>{errors.firstName ? <small>{errors.firstName}</small> : null}</label>
            <label className="mui-field"><input name="lastName" value={form.lastName} onChange={handleChange} placeholder=" " /><span>Last name</span>{errors.lastName ? <small>{errors.lastName}</small> : null}</label>
            <label className="mui-field"><input name="email" value={form.email} onChange={handleChange} placeholder=" " /><span>Email address</span>{errors.email ? <small>{errors.email}</small> : null}</label>
            <label className="mui-field"><input name="phone" value={form.phone} onChange={handleChange} placeholder=" " /><span>Phone number</span>{errors.phone ? <small>{errors.phone}</small> : null}</label>
            <label className="mui-field password-field"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder=" " /><span>Password</span><PasswordToggle isVisible={showPassword} label="Toggle password visibility" onClick={() => setShowPassword((show) => !show)} />{errors.password ? <small>{errors.password}</small> : null}</label>
            <label className="mui-field password-field"><input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder=" " /><span>Confirm password</span><PasswordToggle isVisible={showConfirmPassword} label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword((show) => !show)} />{errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}</label>
            <button disabled={isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300 sm:col-span-2">
              {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : null}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
            <p className="text-center text-sm text-stone-600 sm:col-span-2">Already approved? <Link href="/admin/login" className="font-bold text-[#b61f4b]">Login</Link></p>
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
