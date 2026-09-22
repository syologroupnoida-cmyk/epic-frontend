import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordToggle from "@/components/auth/PasswordToggle";

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function dummyResetPasswordApi(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 500));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    setStatus("");
    if (form.password.length < 6) nextErrors.password = "New password must be 6 characters";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await dummyResetPasswordApi(form);
    setStatus("Password updated successfully. You can sign in now.");
  }

  return (
    <AuthShell
      mode="signup"
      eyebrow="Secure Reset"
      title="Create a new password"
      text="Use the link from your email to set a fresh password for your account."
    >
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
          <button className="h-12 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f]">
            Update Password
          </button>
          {status ? <p className="text-sm font-bold text-[#24784f]">{status}</p> : null}
          <p className="text-sm text-stone-600">
            Back to{" "}
            <Link href="/agent/login" className="font-bold text-[#b61f4b]">
              sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
